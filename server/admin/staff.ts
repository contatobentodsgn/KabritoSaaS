import "server-only";
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { profiles } from "@/db/schema";
import { recordSystemAudit } from "@/server/admin/audit-system";
import { AUDIT_ACTIONS } from "@/lib/constants";

/**
 * Promove/rebaixa uma conta a STAFF por e-mail (editor | superadmin | null).
 * Rotina administrativa: service-client isolado. "Admin" = conta normal com
 * staff_role definido (PROJECT_MASTER_DOCUMENT §9). Não há login de admin separado.
 */
export type StaffRoleValue = "editor" | "superadmin" | null;

export async function setStaffRole(
  email: string,
  role: StaffRoleValue,
): Promise<{ ok: boolean; message: string }> {
  const db = getServiceDbClient();
  // Lê o papel atual ANTES do update para auditar a transição de→para.
  const [before] = await db
    .select({ id: profiles.id, role: profiles.staffRole })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (!before) {
    return { ok: false, message: `Conta não encontrada: ${email} (cadastre-se primeiro).` };
  }
  await db.update(profiles).set({ staffRole: role }).where(eq(profiles.id, before.id));
  // Trilha de auditoria: concessão/rebaixamento de privilégio de staff (de→para).
  await recordSystemAudit({
    action: AUDIT_ACTIONS.STAFF_ROLE_SET,
    userId: before.id,
    entityType: "profile",
    entityId: before.id,
    metadata: { email, from: before.role ?? null, to: role },
  });
  return { ok: true, message: `${email} agora é ${role ?? "assinante comum"}.` };
}
