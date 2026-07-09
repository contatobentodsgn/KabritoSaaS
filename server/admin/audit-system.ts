import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
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
        // E-mail normalizado (lowercase): o rate-limit por IP já existe; isto
        // aqui é a CHAVE lida por isLoginLockedOut, então precisa bater
        // independente de como o usuário/atacante capitalizou o e-mail.
        metadata: {
          email: p.email.toLowerCase(),
          reason: p.reason ?? "invalid_credentials",
        },
      });
  } catch (err) {
    console.error("[audit-system] failed-login", err);
  }
}

const LOCKOUT_WINDOW_MIN = 15;
const LOCKOUT_THRESHOLD = 8;

/**
 * Bloqueio PROGRESSIVO por conta (SEC-4) — camada ADICIONAL ao rate-limit por
 * IP (que já existe, 10/min). Cobre o caso que o rate-limit por IP sozinho não
 * pega: credential-stuffing DISTRIBUÍDO (mesma conta, várias origens/IPs). Lê
 * access_logs (accumulado por recordFailedLogin) — sem tabela nova.
 *
 * Keyed por E-MAIL (não userId): a checagem roda ANTES de saber se a conta
 * existe (mantém o anti-enumeração do restante do login). Janela DESLIZANTE
 * de tempo (não um contador persistente/resetável) — o lock expira sozinho
 * ~LOCKOUT_WINDOW_MIN após a última falha real; requisições BLOQUEADAS por
 * este check NÃO geram uma nova entrada de log, para não auto-estender o
 * lock indefinidamente (um invasor martelando o endpoint não consegue manter
 * a conta trancada para sempre).
 *
 * Trade-off consciente: em teoria um atacante que SABE o e-mail da vítima
 * pode forçar esse throttle de propósito (nunca permanente — expira sozinho).
 * Aceitável: o rate-limit por IP já impõe o mesmo trade-off numa escala menor.
 */
export async function isLoginLockedOut(email: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MIN * 60_000);
    const rows = await getServiceDbClient()
      .select({ id: accessLogs.id })
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.action, "auth.login_failed"),
          gte(accessLogs.createdAt, since),
          sql`${accessLogs.metadata} ->> 'email' = ${email.toLowerCase()}`,
        ),
      )
      .limit(LOCKOUT_THRESHOLD);
    return rows.length >= LOCKOUT_THRESHOLD;
  } catch (err) {
    console.error("[audit-system] isLoginLockedOut:", err);
    return false; // fail-open — uma falha nesta checagem nunca trava o login
  }
}
