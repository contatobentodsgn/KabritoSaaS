import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv, serverEnv } from "@/server/env";

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
    const { error } = await admin.auth.admin.deleteUser(userId);
    return { authDeleted: !error };
  } catch (err) {
    console.error("[account] purgeAccountAccess deleteUser:", err);
    return { authDeleted: false };
  }
}
