"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import {
  generateRecoveryCodes,
  deleteRecoveryCodes,
  verifyRecoveryCode,
} from "@/server/auth/mfa";
import { resetUserMfaById } from "@/server/admin/supabase-admin";
import { consume } from "@/server/rate-limit";
import { DEFAULT_REDIRECT, LOGIN_ROUTE } from "@/lib/constants";
import { rateLimitMessage } from "@/lib/messages";
import type { ActionResult } from "@/server/actions/types";

export type EnrollResult = ActionResult<{
  factorId: string;
  qrCode: string;
  secret: string;
}>;

export type MfaResult = ActionResult;

export type ConfirmEnrollResult = ActionResult<{ recoveryCodes: string[] }>;

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

/**
 * Confirma a ativação verificando o código do app autenticador. Em sucesso,
 * gera os recovery codes (SEC-3) — mostrados 1x ao usuário pelo componente
 * chamador; só o hash persiste a partir daqui.
 */
export async function confirmEnrollAction(
  factorId: string,
  code: string,
): Promise<ConfirmEnrollResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  // Anti brute-force do código de 6 dígitos (não depende só do throttle do provedor).
  const rl = await consume("mfa_verify", user.id);
  if (!rl.success) {
    return { ok: false, error: rateLimitMessage(rl.resetAt) };
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
  try {
    const recoveryCodes = await generateRecoveryCodes(user.id);
    return { ok: true, recoveryCodes };
  } catch {
    // 2FA já está ativo neste ponto (challengeAndVerify passou) — não desfaz
    // a ativação por causa disto; só fica sem recovery codes desta vez.
    return { ok: true, recoveryCodes: [] };
  }
}

/** Desativa o 2FA (remove o fator) — os recovery codes ficam sem sentido, remove também. */
export async function disableMfaAction(factorId: string): Promise<MfaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: "Não foi possível desativar o 2FA." };
  await deleteRecoveryCodes(user.id);
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
  const rl = await consume("mfa_verify", user.id);
  if (!rl.success) {
    return { ok: false, error: rateLimitMessage(rl.resetAt) };
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

/**
 * Verifica um RECOVERY CODE no lugar do TOTP (perdeu o autenticador — SEC-3).
 * Ao acertar: remove TODOS os fatores MFA da conta via admin API (só ela
 * consegue sem aal2 — ver server/admin/supabase-admin.ts:resetUserMfaById) e
 * redireciona a /settings?mfa=recovered — NÃO ao DEFAULT_REDIRECT — para que
 * a pessoa veja de cara o aviso de reativar o 2FA.
 */
export async function verifyRecoveryCodeAction(
  code: string,
): Promise<MfaResult> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);
  const rl = await consume("mfa_verify", user.id);
  if (!rl.success) {
    return { ok: false, error: rateLimitMessage(rl.resetAt) };
  }
  const valid = await verifyRecoveryCode(user.id, code);
  if (!valid) {
    return { ok: false, error: "Código de recuperação inválido ou já usado." };
  }
  await resetUserMfaById(user.id);
  // O fator MFA foi removido: os demais recovery codes (não usados) ficam
  // órfãos/sem propósito — limpa junto (o próximo enroll gera um lote novo).
  await deleteRecoveryCodes(user.id);
  redirect("/settings?mfa=recovered");
}
