"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { recordAudit } from "@/server/audit/log";
import { purgeAccountAccess } from "@/server/admin/supabase-admin";
import { AUDIT_ACTIONS } from "@/lib/constants";

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

  const supabase = await createClient();

  // 1) Purga dados próprios que a RLS permite ao usuário (favoritos + sessões).
  //    O soft-delete/anonimização do PERFIL (deleted_at) não está mais ao alcance
  //    do usuário (migration 0009) — vai junto da rotina admin abaixo.
  await supabase.from("user_favorites").delete().eq("user_id", user.id);
  await supabase
    .from("user_sessions")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await recordAudit({ action: AUDIT_ACTIONS.ACCOUNT_DELETED, entityType: "profile" });

  // 2) Service role isolado: soft-delete/anonimiza o perfil, revoga o acesso pago
  //    (membership) e deleta auth.users. Mesmo se a deleção em auth.users falhar,
  //    a conta fica neutralizada: sessões revogadas (acima), perfil marcado
  //    deleted_at, membership removida (sem acesso pago) e o gate de deleted_at no
  //    login impede reentrada — exclusão não-reversível.
  await purgeAccountAccess(user.id);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
