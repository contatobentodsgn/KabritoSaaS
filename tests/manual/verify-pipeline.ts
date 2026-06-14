/**
 * Verificação MANUAL ponta-a-ponta (Fase 5) contra o Postgres local + provider MOCK.
 * Prova: gera draft válido; idempotência; saída inválida NÃO grava; custo registrado.
 * Uso: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-pipeline.ts
 */
import { and, eq } from "drizzle-orm";
import { runDailyGeneration } from "@/server/pipeline/run";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  platforms,
  contentEditions,
  trendItems,
  headlines as headlinesTable,
  generationRuns,
} from "@/db/schema";

const db = getServiceDbClient();
let failures = 0;
const check = (label: string, cond: boolean) => {
  console.log(`${cond ? "✅" : "❌"} ${label}`);
  if (!cond) failures++;
};

const [ig] = await db.select().from(platforms).where(eq(platforms.slug, "instagram"));
if (!ig) {
  console.error("Rode o seed antes (npm run db:seed).");
  process.exit(1);
}

const date1 = "2026-06-13";
const date2 = "2026-06-14";
await db.delete(contentEditions).where(and(eq(contentEditions.platformId, ig.id), eq(contentEditions.editionDate, date1)));
await db.delete(contentEditions).where(and(eq(contentEditions.platformId, ig.id), eq(contentEditions.editionDate, date2)));

// 1) Geração válida → draft
const r1 = await runDailyGeneration({ platformId: ig.id, platformSlug: "instagram", editionDate: date1 });
check("run1 ok", r1.ok);
check("run1 gerou editionId", !!r1.editionId);
check("run1 registrou custo (>=0)", (r1.metrics?.costUsd ?? -1) >= 0);

const [ed] = await db.select().from(contentEditions).where(eq(contentEditions.id, r1.editionId!));
check("edição está em DRAFT", ed?.status === "draft");
check("review_status = pending", ed?.reviewStatus === "pending");
check("briefing persistido (jsonb)", !!ed?.briefing);

const trends = await db.select().from(trendItems).where(eq(trendItems.editionId, r1.editionId!));
const heads = await db.select().from(headlinesTable).where(eq(headlinesTable.editionId, r1.editionId!));
check("pautas persistidas (>=3)", trends.length >= 3);
check("headlines persistidas (>=3)", heads.length >= 3);

const [run1] = await db.select().from(generationRuns).where(eq(generationRuns.id, r1.runId));
check("generation_run completed", run1?.status === "completed");

// 2) Idempotência
const r2 = await runDailyGeneration({ platformId: ig.id, platformSlug: "instagram", editionDate: date1 });
check("run2 idempotente (skipped)", r2.skipped === true && r2.editionId === r1.editionId);

// 3) Saída inválida → NÃO grava + run failed
process.env.PIPELINE_FORCE_INVALID = "headlines";
const r3 = await runDailyGeneration({ platformId: ig.id, platformSlug: "instagram", editionDate: date2 });
check("run3 falhou (saída inválida)", r3.ok === false);
const edits2 = await db.select().from(contentEditions).where(and(eq(contentEditions.platformId, ig.id), eq(contentEditions.editionDate, date2)));
check("nenhuma edição gravada na falha (não publica)", edits2.length === 0);
const [run3] = await db.select().from(generationRuns).where(eq(generationRuns.id, r3.runId));
check("generation_run3 = failed com erro", run3?.status === "failed" && !!run3?.errorMessage);
delete process.env.PIPELINE_FORCE_INVALID;

// 4) Teto de custo
const r4 = await runDailyGeneration({
  platformId: ig.id,
  platformSlug: "instagram",
  editionDate: "2026-06-15",
  caps: { costCapUsd: 0.0000001, tokenCap: 10_000_000 },
});
check("run4 estourou teto de custo e não publicou", r4.ok === false && /custo/i.test(r4.error ?? ""));

console.log(failures === 0 ? "\n✅ PIPELINE OK" : `\n❌ ${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
