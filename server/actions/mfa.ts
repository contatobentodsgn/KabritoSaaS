"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { consume } from "@/server/rate-limit";
import { DEFAULT_REDIRECT, LOGIN_ROUTE } from "@/lib/constants";

export type EnrollResult =
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; error: string };

export type MfaResult = { ok: true } | { ok: false; error: string };

/**
 * Inicia a ativação do 2FA: cria um fator TOTP e devolve o QR + o segredo para
 * o app autenticador. Remove fatores não-verificados pendentes antes (evita o
 * erro "factor already exists" se uma ativação anterior ficou pela metade).
 */
export async function startEnrollAction(): Promise<EnrollResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const supabase = await createClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Kabrito",
  });
  if (error || !data)
    return { ok: false, error: "Não foi possível iniciar a ativação." };
  return {
    ok: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** Confirma a ativação verificando o código do app autenticador. */
export async function confirmEnrollAction(
  factorId: string,
  code: string,
): Promise<MfaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  // Anti brute-force do código de 6 dígitos (não depende só do throttle do provedor).
  if (!(await consume("mfa_verify", user.id)).success) {
    return {
      ok: false,
      error: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return {
      ok: false,
      error: "Código inválido. Confira o app autenticador e tente de novo.",
    };
  }
  revalidatePath("/settings");
  return { ok: true };
}

/** Desativa o 2FA (remove o fator). */
export async function disableMfaAction(factorId: string): Promise<MfaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: "Não foi possível desativar o 2FA." };
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Verifica o código TOTP no LOGIN (eleva a sessão de aal1 → aal2). Em sucesso,
 * redireciona ao app; em erro, devolve a mensagem para o formulário.
 */
export async function verifyLoginMfaAction(
  factorId: string,
  code: string,
): Promise<MfaResult> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);
  if (!(await consume("mfa_verify", user.id)).success) {
    return {
      ok: false,
      error: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return {
      ok: false,
      error:
        "Código inválido. Confira o código atual no app autenticador e tente de novo.",
    };
  }
  redirect(DEFAULT_REDIRECT);
}
