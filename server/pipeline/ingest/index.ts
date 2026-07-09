import "server-only";
import { and, eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { ingestionSources, rawSignals } from "@/db/schema";
import { collectRss } from "@/server/pipeline/ingest/rss";
import { collectSeed } from "@/server/pipeline/ingest/manual-seed";
import { collectApi } from "@/server/pipeline/ingest/api";
import { collectTrends } from "@/server/pipeline/ingest/trends";

/**
 * Ingestão de sinais de FONTES LEGAIS (sem scraping de redes — PROJECT §7).
 * Cada conector salva itens brutos em raw_signals vinculados ao generation_run.
 * Falha de uma fonte NÃO derruba o run: loga e segue (pior caso = menos sinal).
 */
export interface IngestResult {
  signalsSummary: string;
  collected: number;
}

export async function runIngestion(
  runId: string,
  platformId: string,
): Promise<IngestResult> {
  const db = getServiceDbClient();
  const sources = await db
    .select()
    .from(ingestionSources)
    .where(eq(ingestionSources.isActive, true));

  const items: string[] = [];
  let collected = 0;

  for (const source of sources) {
    try {
      let signals: string[] = [];
      if (source.type === "rss") signals = await collectRss(source.config);
      else if (source.type === "api") signals = await collectApi(source.config);
      else if (source.type === "trends")
        signals = await collectTrends(source.config);
      else if (source.type === "manual_seed")
        signals = collectSeed(source.config);

      for (const s of signals.slice(0, 20)) {
        await db.insert(rawSignals).values({
          sourceId: source.id,
          generationRunId: runId,
          platformId,
          rawPayload: { text: s, source: source.name },
        });
        items.push(`- ${s}`);
        collected++;
      }
      await db
        .update(ingestionSources)
        .set({ lastRunAt: new Date() })
        .where(and(eq(ingestionSources.id, source.id)));
    } catch (err) {
      console.error(`[ingest] fonte "${source.name}" falhou:`, err);
    }
  }

  return { signalsSummary: items.join("\n"), collected };
}
