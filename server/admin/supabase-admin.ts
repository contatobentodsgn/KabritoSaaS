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
 * ANTI-LOCKOUT do 2FA (U1): remove os fatores MFA de uma conta que perdeu o
 * autenticador. Como o Supabase TOTP não emite recovery codes nativos, este é o
 * caminho de recuperação — operado por admin via CLI (`npm run mfa:reset`).
 * Service-role (admin API). A pessoa volta a entrar só com a senha e pode
 * reativar o 2FA nas Configurações. Auditado (mfa.admin_reset).
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

  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) {
    return { ok: false, message: `Falha ao listar fatores: ${error.message}` };
  }
  const factors = data?.factors ?? [];
  if (factors.length === 0) {
    return {
      ok: true,
      message: `${email} não tem 2FA ativo (nada a remover).`,
    };
  }

  let removed = 0;
  for (const f of factors) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({
      id: f.id,
      userId,
    });
    if (delErr)
      console.error(
        `[mfa-reset] falha ao remover fator ${f.id}:`,
        delErr.message,
      );
    else removed++;
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
