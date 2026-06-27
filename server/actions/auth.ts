"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  resetRequestSchema,
  newPasswordSchema,
} from "@/lib/validations/auth";
import { provisionNewUser } from "@/server/admin/provisioning";
import { recordFailedLogin } from "@/server/admin/audit-system";
import { isPasswordPwned } from "@/lib/security/pwned";
import { recordLogin, recordLogout } from "@/server/services/session";
import { consume, type RateLimitAction } from "@/server/rate-limit";
import { serverEnv } from "@/server/env";
import { DEFAULT_REDIRECT, LOGIN_ROUTE } from "@/lib/constants";
import type { FormState } from "@/server/actions/types";

async function clientMeta(): Promise<{ ip: string; userAgent: string | null }> {
  const h = await headers();
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown",
    userAgent: h.get("user-agent"),
  };
}

async function clientIp(): Promise<string> {
  return (await clientMeta()).ip;
}

async function limited(action: RateLimitAction): Promise<boolean> {
  const { success } = await consume(action, await clientIp());
  return !success;
}

/**
 * Server Actions de autenticação. Toda entrada validada por Zod.
 * A criação de profile/org/member acontece em transação no provisionamento.
 */

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (await limited("login")) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const meta = await clientMeta();
    await recordFailedLogin({ email: parsed.data.email, ip: meta.ip, userAgent: meta.userAgent });
    return { error: "E-mail ou senha inválidos." };
  }

  if (data.user) {
    // Conta excluída (soft-delete) não reentra — a exclusão não é reversível por
    // relogin (LGPD). Gate espelhado no callback de e-mail/OAuth.
    const { data: prof } = await supabase
      .from("profiles")
      .select("deleted_at")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (prof?.deleted_at) {
      await supabase.auth.signOut();
      const meta = await clientMeta();
      await recordFailedLogin({
        email: parsed.data.email,
        ip: meta.ip,
        userAgent: meta.userAgent,
        reason: "account_deleted",
      });
      return { error: "Esta conta foi excluída." };
    }
    // Controle de sessão por dispositivo + auditoria (Fase 7).
    await recordLogin(data.user.id);
  }

  redirect(DEFAULT_REDIRECT);
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (await limited("register")) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password } = parsed.data;

  // Bloqueia senhas vazadas (HaveIBeenPwned) — alternativa gratuita ao Pro.
  if (await isPasswordPwned(password)) {
    return {
      fieldErrors: {
        password: [
          "Essa senha já apareceu em vazamentos públicos de outros sites (não foi a sua conta que vazou). Por segurança, escolha uma senha diferente.",
        ],
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) {
    return { error: error.message };
  }
  if (!data.user) {
    return { error: "Não foi possível criar a conta." };
  }

  // Pós-cadastro: profile + organização (oculta) + membership(owner) + assinatura.
  await provisionNewUser({ userId: data.user.id, email, name });

  // Auto-confirm desligado → sem sessão ainda: pedir confirmação de e-mail.
  if (!data.session) {
    return {
      ok: true,
      email,
      message: "Conta criada! Confirme seu e-mail para entrar.",
    };
  }

  await recordLogin(data.user.id);
  redirect(DEFAULT_REDIRECT);
}

/**
 * Reenvia o e-mail de confirmação de cadastro. Rate-limited; anti-enumeração
 * (resposta sempre igual). Usado no estado de sucesso do cadastro.
 */
export async function resendConfirmationAction(email: string): Promise<FormState> {
  if (await limited("register")) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido." };
  }
  const supabase = await createClient();
  // Erros silenciados de propósito (não vazar existência/estado da conta).
  await supabase.auth.resend({ type: "signup", email });
  return { ok: true, message: "Link reenviado. Confira sua caixa de entrada (e o spam)." };
}

/**
 * Pede o e-mail de redefinição de senha. Rate-limited. NÃO revela se o e-mail
 * existe (resposta sempre igual — anti-enumeração). O link do e-mail aponta para
 * /api/auth/callback (troca o code por sessão) → /redefinir-senha.
 */
export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (await limited("password_reset")) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const redirectTo = `${serverEnv.APP_URL}/api/auth/callback?redirectTo=/redefinir-senha`;
  // Erros são silenciados de propósito (não vazar existência da conta).
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  return {
    ok: true,
    message:
      "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira sua caixa de entrada.",
  };
}

/**
 * Define a nova senha. Exige sessão (de recuperação) — o usuário chegou aqui via
 * o link do e-mail (callback trocou o code por sessão). Sem sessão = link expirado.
 */
export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (await limited("password_reset")) {
    return { error: "Muitas tentativas. Aguarde um minuto e tente de novo." };
  }
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Link inválido ou expirado. Peça um novo e-mail de redefinição.",
    };
  }
  if (await isPasswordPwned(parsed.data.password)) {
    return {
      fieldErrors: {
        password: [
          "Essa senha já apareceu em vazamentos públicos de outros sites (não foi a sua conta que vazou). Por segurança, escolha uma senha diferente.",
        ],
      },
    };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível atualizar a senha." };
  redirect(DEFAULT_REDIRECT);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await recordLogout(user.id);
  await supabase.auth.signOut();
  redirect(LOGIN_ROUTE);
}

/**
 * Encerra a sessão em TODOS os dispositivos: revoga as sessões rastreadas do
 * usuário (user_sessions, via RLS própria) e faz signOut global (invalida todos
 * os refresh tokens no servidor). Útil se um aparelho foi perdido/comprometido.
 */
export async function signOutAllDevicesAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }
  await supabase.auth.signOut({ scope: "global" });
  redirect(LOGIN_ROUTE);
}
