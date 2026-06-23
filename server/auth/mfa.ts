import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

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
  const currentLevel = (aal?.currentLevel as "aal1" | "aal2" | undefined) ?? null;
  const nextLevel = (aal?.nextLevel as "aal1" | "aal2" | undefined) ?? null;
  return {
    currentLevel,
    nextLevel,
    enrolled: Boolean(verified),
    factorId: verified?.id ?? null,
    pendingAal2: currentLevel === "aal1" && nextLevel === "aal2",
  };
});
