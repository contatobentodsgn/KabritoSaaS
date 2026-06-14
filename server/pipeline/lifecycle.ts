import "server-only";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { contentEditions, rawSignals, accessLogs, auditLogs } from "@/db/schema";

/**
 * Ciclo de vida (PROJECT §2 estágio 5 / §10): rotina diária que aplica a
 * RETENÇÃO ÚNICA — arquiva/expira conteúdo vencido e limpa raw_signals antigos.
 * Roda com service_role ISOLADO. A leitura já respeita a expiração via RLS
 * (is_edition_published checa content_expires_at > now) — aqui fazemos a limpeza.
 */
const RAW_SIGNAL_RETENTION_DAYS = 7;
const LOG_RETENTION_DAYS = 180; // LGPD: retenção limitada de logs (§10)

export interface LifecycleResult {
  archived: number;
  cleanedSignals: number;
  purgedLogs: number;
}

export async function runLifecycle(now: Date = new Date()): Promise<LifecycleResult> {
  const db = getServiceDbClient();

  // 1) Arquiva/expira edições publicadas cujo content_expires_at já passou.
  const archived = await db
    .update(contentEditions)
    .set({ isArchived: true, status: "archived" })
    .where(
      and(
        eq(contentEditions.status, "published"),
        isNotNull(contentEditions.contentExpiresAt),
        lt(contentEditions.contentExpiresAt, now),
      ),
    )
    .returning({ id: contentEditions.id });

  // 2) Limpa raw_signals antigos (retenção curta — minimização LGPD §10).
  const cutoff = new Date(now.getTime() - RAW_SIGNAL_RETENTION_DAYS * 86_400_000);
  const cleaned = await db
    .delete(rawSignals)
    .where(lt(rawSignals.collectedAt, cutoff))
    .returning({ id: rawSignals.id });

  // 3) Retenção de logs (LGPD §10): purga access_logs/audit_logs antigos.
  const logCutoff = new Date(now.getTime() - LOG_RETENTION_DAYS * 86_400_000);
  const purgedAccess = await db
    .delete(accessLogs)
    .where(lt(accessLogs.createdAt, logCutoff))
    .returning({ id: accessLogs.id });
  const purgedAudit = await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, logCutoff))
    .returning({ id: auditLogs.id });

  return {
    archived: archived.length,
    cleanedSignals: cleaned.length,
    purgedLogs: purgedAccess.length + purgedAudit.length,
  };
}
