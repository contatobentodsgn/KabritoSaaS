import "server-only";
import { getServiceDbClient } from "@/server/db/service-client";
import { auditLogs, accessLogs } from "@/db/schema";

/**
 * Auditoria de SISTEMA via service-role (bypass RLS). Para ações que rodam SEM
 * uma sessão de usuário com RLS — ex.: login FALHO (não há auth.uid()), e
 * rotinas de staff/CLI (setStaffRole, grantAccessByEmail). Best-effort: nunca
 * quebra a ação principal. Para ações de usuário logado, use recordAudit (RLS).
 */
export async function recordSystemAudit(p: {
  action: string;
  userId?: string | null;
  organizationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await getServiceDbClient()
      .insert(auditLogs)
      .values({
        action: p.action,
        userId: p.userId ?? null,
        organizationId: p.organizationId ?? null,
        entityType: p.entityType ?? null,
        entityId: p.entityId ?? null,
        metadata: p.metadata ?? null,
      });
  } catch (err) {
    console.error("[audit-system]", err);
  }
}

/**
 * Registra uma tentativa de LOGIN FALHA em access_logs (habilita detecção de
 * brute-force/credential-stuffing). Grava só o e-mail tentado + IP/UA — NUNCA a
 * senha. Via service-role porque não há usuário autenticado no momento da falha.
 */
export async function recordFailedLogin(p: {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
  reason?: string;
}): Promise<void> {
  try {
    await getServiceDbClient()
      .insert(accessLogs)
      .values({
        action: "auth.login_failed",
        userId: null,
        ipAddress: p.ip ?? null,
        userAgent: p.userAgent ?? null,
        metadata: { email: p.email, reason: p.reason ?? "invalid_credentials" },
      });
  } catch (err) {
    console.error("[audit-system] failed-login", err);
  }
}
