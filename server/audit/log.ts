import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentOrgId } from "@/server/auth/session";

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
      metadata: params.metadata ?? null,
    });
  } catch {
    // best-effort
  }
}
