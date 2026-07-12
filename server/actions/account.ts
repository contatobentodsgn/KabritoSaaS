"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { requireAal2 } from "@/server/auth/mfa";
import { recordAudit } from "@/server/audit/log";
import { purgeAccountAccess } from "@/server/admin/supabase-admin";
import { consume } from "@/server/rate-limit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { rateLimitMessage } from "@/lib/messages";
import type { ActionResult } from "@/server/actions/types";

export type DataExport = ActionResult<{ data: Record<string, unknown> }>;

/**
 * PORTABILIDADE DE DADOS (LGPD Art. 18, V/II): devolve os dados pessoais do
 * titular em JSON estruturado. Lê via cliente de USUÁRIO — a RLS garante que só
 * retornam as linhas do próprio usuário. Operação auditada.
 */
export async function exportMyDataAction(): Promise<DataExport> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  const rl = await consume("data_export", user.id);
  if (!rl.success) {
    return { ok: false, error: rateLimitMessage(rl.resetAt) };
  }

  const supabase = await createClient();
  const [profile, favorites, comments, sessions, memberships] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("user_favorites").select("*").eq("user_id", user.id),
      supabase.from("edition_comments").select("*").eq("user_id", user.id),
      supabase.from("user_sessions").select("*").eq("user_id", user.id),
      supabase.from("organization_members").select("*").eq("user_id", user.id),
    ]);

  await recordAudit({ action: "account.data_exported", entityType: "profile" });

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email ?? null },
      profile: profile.data ?? null,
      favorites: favorites.data ?? [],
      comments: comments.data ?? [],
      sessions: sessions.data ?? [],
      memberships: memberships.data ?? [],
    },
  };
}

/**
 * EXCLUSÃO DE CONTA (LGPD — SECURITY_GUIDE §10).
 *
 * Estratégia em camadas, honrando a regra dura (§3):
 *  1. Purga/anonimiza os dados PESSOAIS via cliente de USUÁRIO (RLS: só os
 *     próprios) — profile (deleted_at + anonimização), favoritos, sessões.
 *  2. Só a deleção em auth.users (que exige service role) passa pela rotina
 *     ADMIN isolada. É uma operação de sistema sobre a própria conta.
 */
export async function deleteAccountAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Ação irreversível: se a conta tem 2FA ativo mas a sessão está em aal1,
  // exige verificar o código antes (mesmo destino que os layouts usam).
  const aal2 = await requireAal2();
  if (!aal2.ok) redirect("/verificar");

  const supabase = await createClient();

  // 1) Purga dados próprios que a RLS permite ao usuário (favoritos + sessões).
  //    O soft-delete/anonimização do PERFIL (deleted_at) não está mais ao alcance
  //    do usuário (migration 0009) — vai junto da rotina admin abaixo.
  //    As duas purgas são independentes (tabelas distintas, nenhuma lê o
  //    resultado da outra) — em paralelo em vez de em série.
  await Promise.all([
    supabase.from("user_favorites").delete().eq("user_id", user.id),
    supabase
      .from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id),
  ]);

  await recordAudit({
    action: AUDIT_ACTIONS.ACCOUNT_DELETED,
    entityType: "profile",
  });

  // 2) Service role isolado: soft-delete/anonimiza o perfil, revoga o acesso pago
  //    (membership) e deleta auth.users. Mesmo se a deleção em auth.users falhar,
  //    a conta fica neutralizada: sessões revogadas (acima), perfil marcado
  //    deleted_at, membership removida (sem acesso pago) e o gate de deleted_at no
  //    login impede reentrada — exclusão não-reversível.
  await purgeAccountAccess(user.id);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
