import { cache } from "react";
import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { MFA_ENFORCE } from "@/lib/security/mfa";

export interface MfaStatus {
  /** Nível atual da SESSÃO ('aal1' = só senha, 'aal2' = senha + 2FA). */
  currentLevel: "aal1" | "aal2" | null;
  /** Maior nível possível para a conta (se tem fator verificado → 'aal2'). */
  nextLevel: "aal1" | "aal2" | null;
  /** Tem um fator TOTP verificado (2FA ativo)? */
  enrolled: boolean;
  /** Id do fator verificado (para desativar). */
  factorId: string | null;
  /** Ativou 2FA mas a sessão ainda está em aal1 → falta verificar no login. */
  pendingAal2: boolean;
}

/**
 * Estado de MFA do usuário atual (cliente Supabase → sessão do usuário).
 * Memoizado por request (cache) — usado em layouts + páginas no mesmo render.
 */
export const getMfaStatus = cache(async (): Promise<MfaStatus> => {
  const supabase = await createClient();
  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  const verified = factors?.totp?.find((f) => f.status === "verified") ?? null;
  const currentLevel =
    (aal?.currentLevel as "aal1" | "aal2" | undefined) ?? null;
  const nextLevel = (aal?.nextLevel as "aal1" | "aal2" | undefined) ?? null;
  return {
    currentLevel,
    nextLevel,
    enrolled: Boolean(verified),
    factorId: verified?.id ?? null,
    pendingAal2: currentLevel === "aal1" && nextLevel === "aal2",
  };
});

/**
 * Backstop de AAL2 (SEC-1) para Server Actions SENSÍVEIS: publicar edição,
 * gerência de equipe, exclusão de conta. O gate de 2FA hoje só roda nos
 * LAYOUTS — que só re-executam numa NAVEGAÇÃO (render de página); uma
 * Server Action é invocada via POST de RSC e NÃO re-roda o corpo do layout.
 * Um usuário com 2FA ativo mas ainda em aal1 (ex.: ativou o 2FA numa aba,
 * mas outra aba/sessão mantém o cookie antigo) poderia chamar a action
 * direto, pulando o /verificar. Mesmo flag staged que os layouts (MFA_ENFORCE).
 */
export async function requireAal2(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!MFA_ENFORCE) return { ok: true };
  const mfa = await getMfaStatus();
  if (mfa.pendingAal2) {
    return {
      ok: false,
      error:
        "Confirme o código do seu autenticador para continuar (verificação em duas etapas).",
    };
  }
  return { ok: true };
}

/* ===========================================================================
 * RECOVERY CODES (SEC-3) — elimina a dependência do CLI admin (mfa:reset)
 * para quem perde o autenticador. Gerados 1x na ativação do 2FA, mostrados 1x
 * ao usuário; só o HASH persiste. Acesso via cliente de USUÁRIO (RLS "own
 * row" — migration 0017), não service-role: são dados do próprio usuário.
 * =========================================================================== */

const RECOVERY_CODE_COUNT = 10;

function generateRecoveryCode(): string {
  // 12 chars hex (48 bits) — hex evita a ambiguidade 0/O e 1/I (sem "O"/"I").
  // Redundante com o rate-limit "mfa_verify" (5/min): brute-force online é
  // inviável mesmo num espaço menor; 48 bits fica confortavelmente acima do
  // que um código de recuperação típico do mercado usa.
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Alta entropia (48 bits) → sha256 simples é suficiente (mesmo padrão de
// server/services/session.ts:hashToken); não é senha de baixa entropia, não
// precisa de custo computacional extra (bcrypt/scrypt) para resistir a força bruta.
const hashRecoveryCode = (code: string) =>
  createHash("sha256").update(code.trim().toUpperCase()).digest("hex");

/**
 * Gera RECOVERY_CODE_COUNT códigos NOVOS (substitui quaisquer anteriores —
 * delete + insert). Retorna os códigos EM CLARO: é a ÚNICA vez que existem
 * fora do hash — o chamador deve exibi-los ao usuário AGORA (uma vez) e nunca
 * mais. Chamado só ao CONFIRMAR a ativação do 2FA (sem regeneração
 * self-service nesta 1ª versão — mantém o escopo enxuto).
 */
export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  const supabase = await createClient();
  await supabase.from("mfa_recovery_codes").delete().eq("user_id", userId);
  const codes = Array.from(
    { length: RECOVERY_CODE_COUNT },
    generateRecoveryCode,
  );
  const { error } = await supabase.from("mfa_recovery_codes").insert(
    codes.map((code) => ({
      user_id: userId,
      code_hash: hashRecoveryCode(code),
    })),
  );
  if (error) throw new Error("Falha ao gerar códigos de recuperação.");
  return codes;
}

/** Remove todos os recovery codes do usuário (2FA desativado — ficam sem sentido). */
export async function deleteRecoveryCodes(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("mfa_recovery_codes").delete().eq("user_id", userId);
}

/**
 * Verifica um recovery code contra os hashes NÃO USADOS do usuário. Em caso
 * de acerto, marca o código como usado (uso único) e retorna true. O
 * chamador (verifyRecoveryCodeAction) é responsável por, em caso de sucesso,
 * remover o fator MFA (via admin API — só assim eleva o acesso sem aal2).
 */
export async function verifyRecoveryCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const supabase = await createClient();
  const hash = hashRecoveryCode(code);
  const { data } = await supabase
    .from("mfa_recovery_codes")
    .select("id")
    .eq("user_id", userId)
    .eq("code_hash", hash)
    .is("used_at", null)
    .maybeSingle();
  if (!data) return false;
  await supabase
    .from("mfa_recovery_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
}
