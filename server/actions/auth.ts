"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { provisionNewUser } from "@/server/admin/provisioning";
import { recordLogin, recordLogout } from "@/server/services/session";
import { consume, type RateLimitAction } from "@/server/rate-limit";
import { DEFAULT_REDIRECT, LOGIN_ROUTE } from "@/lib/constants";
import type { FormState } from "@/server/actions/types";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
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
      message:
        "Conta criada! Confirme seu e-mail para entrar. (Se a confirmação estiver desativada, faça login.)",
    };
  }

  await recordLogin(data.user.id);
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
