import "server-only";
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { platforms } from "@/db/schema";
import { runDailyGeneration, type RunResult } from "@/server/pipeline/run";
import { serverEnv } from "@/server/env";

/**
 * Autorização dos endpoints de cron por CRON_SECRET (SECURITY_GUIDE §9).
 * Aceita `Authorization: Bearer <secret>` (formato do Vercel Cron) ou o header
 * `x-cron-secret`. Sem segredo correto → o handler responde 401.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return false; // sem segredo configurado: nega por padrão
  const auth = req.headers.get("authorization") ?? "";
  const x = req.headers.get("x-cron-secret") ?? "";
  return auth === `Bearer ${secret}` || x === secret;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Gera (draft) para todas as plataformas ativas na data. Idempotente por dia. */
export async function generateForActivePlatforms(
  editionDate: string,
): Promise<RunResult[]> {
  const db = getServiceDbClient();
  const rows = await db.select().from(platforms).where(eq(platforms.isActive, true));
  const results: RunResult[] = [];
  for (const p of rows) {
    results.push(
      await runDailyGeneration({
        platformId: p.id,
        platformSlug: p.slug,
        editionDate,
      }),
    );
  }
  return results;
}
