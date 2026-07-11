import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentOrgId } from "@/server/auth/session";
import type { Json } from "@/types/supabase";

/**
 * Auditoria de ações do USUÁRIO/STAFF (audit_logs) via cliente de usuário (RLS:
 * só insere linhas com user_id = auth.uid()). Best-effort: nunca quebra a ação
 * principal. Eventos de SISTEMA (pipeline/publicação automática) são auditados
 * pelo service_role isolado no pipeline. (TECHNICAL_SPEC §9)
 */
export async function recordAudit(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      organization_id: orgId,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      // `Record<string, unknown>` é a assinatura pública (ergonômica pros
      // chamadores); o cast pra Json fica só neste ponto de escrita.
      metadata: (params.metadata ?? null) as Json,
    });
  } catch (err) {
    // Best-effort (nunca quebra a ação principal), mas OBSERVÁVEL: um furo na
    // trilha de auditoria não pode ser invisível (G7 — auditoria confiável).
    console.error(
      "[audit] falha ao registrar evento:",
      params.action,
      err instanceof Error ? err.message : String(err),
    );
  }
}
