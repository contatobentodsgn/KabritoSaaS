import "server-only";
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { profiles } from "@/db/schema";

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
  const res = await db
    .update(profiles)
    .set({ staffRole: role })
    .where(eq(profiles.email, email))
    .returning({ id: profiles.id });
  if (res.length === 0) {
    return { ok: false, message: `Conta não encontrada: ${email} (cadastre-se primeiro).` };
  }
  return { ok: true, message: `${email} agora é ${role ?? "assinante comum"}.` };
}
