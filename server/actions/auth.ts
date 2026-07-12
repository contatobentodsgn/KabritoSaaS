"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  resetRequestSchema,
  newPasswordSchema,
} from "@/lib/validations/auth";
import { provisionNewUser } from "@/server/admin/provisioning";
import {
  recordFailedLogin,
  isLoginLockedOut,
} from "@/server/admin/audit-system";
import { isPasswordPwned } from "@/lib/security/pwned";
import {
  recordLogin,
  recordLogout,
  getOrCreateDeviceId,
} from "@/server/services/session";
import { recordAudit } from "@/server/audit/log";
import { consume, type RateLimitAction } from "@/server/rate-limit";
import { serverEnv } from "@/server/env";
import { AUDIT_ACTIONS, DEFAULT_REDIRECT, LOGIN_ROUTE } from "@/lib/constants";
import { getClientMeta } from "@/lib/request";
import { rateLimitMessage } from "@/lib/messages";
import type { FormState } from "@/server/actions/types";

/** Null se dentro do limite; senão o `resetAt` (epoch ms) do bucket estourado. */
async function limited(action: RateLimitAction): Promise<number | null> {
  const ip = (await getClientMeta()).ip ?? "unknown";
  const { success, resetAt } = await consume(action, ip);
  return success ? null : resetAt;
}

/**
 * Server Actions de autenticação. Toda entrada validada por Zod.
 * A criação de profile/org/member acontece em transação no provisionamento.
 */

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const loginResetAt = await limited("login");
  if (loginResetAt) {
    return { error: rateLimitMessage(loginResetAt) };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Bloqueio progressivo por conta (SEC-4) — além do rate-limit por IP acima,
  // cobre credential-stuffing distribuído (mesma conta, IPs variados).
  if (await isLoginLockedOut(parsed.data.email)) {
    return {
      error:
        "Muitas tentativas para esta conta. Aguarde alguns minutos e tente de novo.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const meta = await getClientMeta();
    await recordFailedLogin({
      email: parsed.data.email,
      ip: meta.ip ?? "unknown",
      userAgent: meta.userAgent,
    });
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
      const meta = await getClientMeta();
      await recordFailedLogin({
        email: parsed.data.email,
        ip: meta.ip ?? "unknown",
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
  const registerResetAt = await limited("register");
  if (registerResetAt) {
    return { error: rateLimitMessage(registerResetAt) };
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
    // Anti-enumeração: NÃO revelar se o e-mail já existe. "already registered"
    // (e variantes) devolve o MESMO estado de um cadastro novo; outros erros
    // viram mensagem genérica (sem ecoar o texto interno do provedor).
    const m = error.message?.toLowerCase() ?? "";
    if (
      m.includes("already") ||
      m.includes("registered") ||
      m.includes("exists")
    ) {
      return {
        ok: true,
        email,
        message: "Conta criada! Confirme seu e-mail para entrar.",
      };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
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
 * Reenvia o e-mail de confirmação de cadastro. Rate-limited em bucket PRÓPRIO
 * (UX-1) — separado do "register" para o botão de reenvio ter um cooldown
 * previsível (1/60s) em vez de brigar pela cota de tentativas de cadastro.
 * Devolve `resetAt` em sucesso E falha para o formulário renderizar o
 * contador. Anti-enumeração: resposta sempre igual.
 */
export async function resendConfirmationAction(
  email: string,
): Promise<FormState> {
  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido." };
  }
  const ip = (await getClientMeta()).ip ?? "unknown";
  const rl = await consume("resend_confirmation", ip);
  if (!rl.success) {
    return { error: rateLimitMessage(rl.resetAt), email, resetAt: rl.resetAt };
  }
  const supabase = await createClient();
  // Erros silenciados de propósito (não vazar existência/estado da conta).
  await supabase.auth.resend({ type: "signup", email });
  return {
    ok: true,
    email,
    resetAt: rl.resetAt,
    message: "Link reenviado. Confira sua caixa de entrada (e o spam).",
  };
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
  const resetRequestResetAt = await limited("password_reset");
  if (resetRequestResetAt) {
    return { error: rateLimitMessage(resetRequestResetAt) };
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
  const updatePasswordResetAt = await limited("password_reset");
  if (updatePasswordResetAt) {
    return { error: rateLimitMessage(updatePasswordResetAt) };
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
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { error: "Não foi possível atualizar a senha." };

  // Uma sessão vazada/roubada não deve sobreviver à troca de senha. Revoga
  // todas as OUTRAS sessões (scope "others" — mantém a atual, o próprio
  // dispositivo onde a troca acabou de acontecer, sem deslogar quem trocou).
  const deviceId = await getOrCreateDeviceId();
  // 3 efeitos colaterais independentes de "revogar as outras sessões": nenhum
  // lê o resultado do outro (deviceId já foi resolvido acima) — em paralelo em
  // vez de em série.
  await Promise.all([
    supabase
      .from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .neq("device_id", deviceId),
    supabase.auth.signOut({ scope: "others" }),
    recordAudit({
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entityType: "profile",
    }),
  ]);

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
