import "server-only";
import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  contentEditions,
  rawSignals,
  accessLogs,
  auditLogs,
  userSessions,
  orgInvites,
} from "@/db/schema";
import {
  RAW_SIGNAL_RETENTION_DAYS,
  LOG_RETENTION_DAYS,
  ACCEPTED_INVITE_RETENTION_DAYS,
} from "@/lib/config";

/**
 * Ciclo de vida (PROJECT §2 estágio 5 / §10): rotina diária que aplica a
 * RETENÇÃO ÚNICA — arquiva/expira conteúdo vencido e limpa raw_signals antigos.
 * Roda com service_role ISOLADO. A leitura já respeita a expiração via RLS
 * (is_edition_published checa content_expires_at > now) — aqui fazemos a limpeza.
 */

export interface LifecycleResult {
  archived: number;
  cleanedSignals: number;
  purgedLogs: number;
  purgedSessions: number;
  purgedInvites: number;
}

export async function runLifecycle(
  now: Date = new Date(),
): Promise<LifecycleResult> {
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
  const cutoff = new Date(
    now.getTime() - RAW_SIGNAL_RETENTION_DAYS * 86_400_000,
  );
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

  // 4) LGPD: expurga sessões INATIVAS/revogadas antigas (guardam IP + user-agent).
  // Sessões ativas são preservadas (necessárias); a exclusão de conta deleta todas.
  const purgedSessions = await db
    .delete(userSessions)
    .where(
      and(
        eq(userSessions.isActive, false),
        lt(userSessions.createdAt, logCutoff),
      ),
    )
    .returning({ id: userSessions.id });

  // 5) LGPD: expurga convites que cumpriram a finalidade — aceitos há mais de 30d
  // (o e-mail do convidado é dado pessoal) + pendentes obsoletos além da janela.
  const inviteCutoff = new Date(
    now.getTime() - ACCEPTED_INVITE_RETENTION_DAYS * 86_400_000,
  );
  const purgedInvites = await db
    .delete(orgInvites)
    .where(
      or(
        and(
          isNotNull(orgInvites.acceptedAt),
          lt(orgInvites.acceptedAt, inviteCutoff),
        ),
        lt(orgInvites.createdAt, logCutoff),
      ),
    )
    .returning({ id: orgInvites.id });

  return {
    archived: archived.length,
    cleanedSignals: cleaned.length,
    purgedLogs: purgedAccess.length + purgedAudit.length,
    purgedSessions: purgedSessions.length,
    purgedInvites: purgedInvites.length,
  };
}
