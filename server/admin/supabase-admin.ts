import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv, serverEnv } from "@/server/env";
import { recordSystemAudit } from "@/server/admin/audit-system";

/**
 * Cliente Supabase com SERVICE_ROLE (bypass RLS) — ISOLADO em server/admin.
 * Usado só para operações administrativas que a API pública não permite, p.ex.
 * deletar o usuário em auth.users (LGPD). NUNCA importar fora de pasta isolada.
 */
export function createAdminSupabase() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Deleta o usuário em auth.users (exige service role). Best-effort. */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const admin = createAdminSupabase();
    const { error } = await admin.auth.admin.deleteUser(userId);
    return !error;
  } catch (err) {
    console.error("[account] deleteAuthUser:", err);
    return false;
  }
}

/**
 * Revoga o ACESSO da conta no lado servidor (service role, isolado em admin) e
 * deleta o usuário em auth.users. Usado na exclusão de conta (LGPD).
 *
 * Por que via service role: a RLS NÃO dá ao usuário escrita em
 * organization_members, e o conteúdo pago é liberado por has_active_subscription()
 * — que depende da membership. Remover a membership corta o acesso pago de forma
 * confiável mesmo que a deleção em auth.users falhe (o que, somado ao gate de
 * deleted_at no login, torna a exclusão NÃO reversível por relogin).
 *
 * Retorna se a deleção em auth.users de fato ocorreu (para o chamador decidir).
 */
export async function purgeAccountAccess(
  userId: string,
): Promise<{ authDeleted: boolean }> {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return { authDeleted: false };
  const admin = createAdminSupabase();
  try {
    // Soft-delete + anonimização do perfil. Via service role porque `deleted_at`
    // saiu do grant de UPDATE de `authenticated` (migration 0009) — o usuário não
    // pode escrever a própria flag de exclusão (anti auto-ressurreição).
    await admin
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        name: null,
        email: `deleted+${userId}@example.invalid`,
      })
      .eq("user_id", userId);
  } catch (err) {
    console.error("[account] purgeAccountAccess profile:", err);
  }
  try {
    await admin.from("organization_members").delete().eq("user_id", userId);
  } catch (err) {
    console.error("[account] purgeAccountAccess memberships:", err);
  }
  try {
    // LGPD: anonimiza os comentários do titular (nome real denormalizado + corpo).
    // edition_comments não tem FK para auth.users → deletar o usuário não cascateia.
    await admin
      .from("edition_comments")
      .update({ author_name: null, body: "[comentário removido]" })
      .eq("user_id", userId);
  } catch (err) {
    console.error("[account] purgeAccountAccess comments:", err);
  }
  try {
    // LGPD: remove as sessões do titular (IP/user-agent) — não basta desativar.
    await admin.from("user_sessions").delete().eq("user_id", userId);
  } catch (err) {
    console.error("[account] purgeAccountAccess sessions:", err);
  }
  try {
    const { error } = await admin.auth.admin.deleteUser(userId);
    return { authDeleted: !error };
  } catch (err) {
    console.error("[account] purgeAccountAccess deleteUser:", err);
    return { authDeleted: false };
  }
}

/**
 * Remove TODOS os fatores MFA de um userId via admin API (service-role) —
 * núcleo compartilhado por resetUserMfa (CLI) e resetUserMfaById (recovery
 * code self-service). Só a admin API consegue: o unenroll self-service do
 * Supabase (supabase.auth.mfa.unenroll) exige aal2 — exatamente o que falta
 * quem perdeu o autenticador. Retorna quantos fatores foram removidos.
 */
async function unenrollAllFactors(
  admin: ReturnType<typeof createAdminSupabase>,
  userId: string,
): Promise<number> {
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) throw new Error(`Falha ao listar fatores: ${error.message}`);
  const factors = data?.factors ?? [];
  let removed = 0;
  for (const f of factors) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({
      id: f.id,
      userId,
    });
    if (delErr) {
      console.error(
        `[mfa-reset] falha ao remover fator ${f.id}:`,
        delErr.message,
      );
    } else {
      removed++;
    }
  }
  return removed;
}

/**
 * ANTI-LOCKOUT do 2FA (U1): remove os fatores MFA de uma conta que perdeu o
 * autenticador. Operado por ADMIN via CLI (`npm run mfa:reset`). Service-role
 * (admin API). A pessoa volta a entrar só com a senha e pode reativar o 2FA
 * nas Configurações. Auditado (mfa.admin_reset).
 */
export async function resetUserMfa(
  email: string,
): Promise<{ ok: boolean; message: string }> {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY ausente." };
  }
  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();
  const userId = (profile?.user_id as string | undefined) ?? null;
  if (!userId) {
    return { ok: false, message: `Conta não encontrada: ${email}.` };
  }

  let removed: number;
  try {
    removed = await unenrollAllFactors(admin, userId);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Falha ao remover 2FA.",
    };
  }
  if (removed === 0) {
    return {
      ok: true,
      message: `${email} não tem 2FA ativo (nada a remover).`,
    };
  }

  await recordSystemAudit({
    action: "mfa.admin_reset",
    userId,
    entityType: "profile",
    entityId: userId,
    metadata: { email, removed },
  });

  return {
    ok: true,
    message: `2FA de ${email} removido (${removed} fator(es)). A pessoa entra só com a senha e pode reativar nas Configurações.`,
  };
}

/**
 * ANTI-LOCKOUT self-service (SEC-3): mesma remoção de fatores que resetUserMfa,
 * mas SELF-TRIGGERED por quem acabou de provar posse de um recovery code
 * válido (verificado em server/auth/mfa.ts:verifyRecoveryCode ANTES de chamar
 * isto — esta função em si não valida nada, só executa a remoção). Keyed por
 * userId (já disponível via getCurrentUser() no chamador — sem lookup por
 * e-mail). Auditado com ação DISTINTA (mfa.recovery_code_used) da do CLI.
 */
export async function resetUserMfaById(
  userId: string,
): Promise<{ ok: boolean; removed: number }> {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, removed: 0 };
  const admin = createAdminSupabase();
  try {
    const removed = await unenrollAllFactors(admin, userId);
    await recordSystemAudit({
      action: "mfa.recovery_code_used",
      userId,
      entityType: "profile",
      entityId: userId,
      metadata: { removed },
    });
    return { ok: true, removed };
  } catch (err) {
    console.error("[mfa-recovery] resetUserMfaById:", err);
    return { ok: false, removed: 0 };
  }
}
