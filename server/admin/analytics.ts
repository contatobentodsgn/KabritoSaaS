import "server-only";
import { sql, eq, count, desc } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { generationRuns, contentEditions, userFavorites } from "@/db/schema";

/**
 * ANALYTICS DE USO — rotina administrativa interna (área de staff).
 *
 * Usa o service-client (RLS ignorada) porque agrega dados CROSS-USER de sistema
 * (ex.: favoritos de todos os assinantes) para informar a melhoria de prompts.
 * (SECURITY_GUIDE §3 — server/admin é pasta isolada.)
 *
 * Regra de privacidade: estas funções retornam SOMENTE agregados. Nenhum dado
 * pessoal identificável (user_id, e-mail, etc.) sai daqui.
 */

/** Linha de desempenho por versão de prompt — sinal central p/ iterar prompts. */
export interface RunsByPromptVersion {
  version: string;
  total: number;
  completed: number;
  failed: number;
  avgCostUsd: number;
  totalTokens: number;
}

/**
 * Runs agrupados por `prompt_version`: total, completos, falhos, custo médio e
 * tokens somados. A taxa de falha + custo médio é o que orienta o tuning.
 */
export async function runsByPromptVersion(): Promise<RunsByPromptVersion[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({
      version: sql<string>`coalesce(${generationRuns.promptVersion}, 'sem versão')`,
      total: count(),
      completed: sql<number>`count(*) filter (where ${generationRuns.status} = 'completed')::int`,
      failed: sql<number>`count(*) filter (where ${generationRuns.status} = 'failed')::int`,
      avgCostUsd: sql<number>`coalesce(avg(${generationRuns.costEstimate}) filter (where ${generationRuns.status} = 'completed'), 0)::float8`,
      totalTokens: sql<number>`coalesce(sum(coalesce(${generationRuns.inputTokens}, 0) + coalesce(${generationRuns.outputTokens}, 0)), 0)::int`,
    })
    .from(generationRuns)
    .groupBy(sql`coalesce(${generationRuns.promptVersion}, 'sem versão')`)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    version: r.version,
    total: Number(r.total),
    completed: Number(r.completed),
    failed: Number(r.failed),
    avgCostUsd: Number(r.avgCostUsd),
    totalTokens: Number(r.totalTokens),
  }));
}

/** Contagem de edições por status de revisão. */
export interface ReviewOutcome {
  status: "pending" | "in_review" | "approved" | "rejected";
  total: number;
}

/**
 * Distribuição das edições por `review_status` (aprovadas / rejeitadas /
 * pendentes / em revisão) — qualidade percebida da saída do pipeline.
 */
export async function reviewOutcomes(): Promise<ReviewOutcome[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({
      status: contentEditions.reviewStatus,
      total: count(),
    })
    .from(contentEditions)
    .groupBy(contentEditions.reviewStatus)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    status: r.status,
    total: Number(r.total),
  }));
}

/** Contagem de favoritos por tipo de entidade (cross-user). */
export interface FavoriteByType {
  entityType: string;
  total: number;
}

/**
 * Favoritos por `entity_type` somando TODOS os usuários — revela quais formatos
 * de conteúdo o público mais salva. Cross-user => exige service-client.
 */
export async function favoritesByType(): Promise<FavoriteByType[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({
      entityType: userFavorites.entityType,
      total: count(),
    })
    .from(userFavorites)
    .groupBy(userFavorites.entityType)
    .orderBy(desc(count()));

  return rows.map((r) => ({
    entityType: r.entityType,
    total: Number(r.total),
  }));
}

/** Custo e tokens totais dos runs completos. */
export interface CostSummary {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  completedRuns: number;
}

/**
 * Soma de `cost_estimate` e tokens dos runs com status `completed`. Os runs
 * falhos ficam de fora do custo "produtivo" (mas aparecem na taxa de falha).
 */
export async function costSummary(): Promise<CostSummary> {
  const db = getServiceDbClient();
  const [row] = await db
    .select({
      totalCostUsd: sql<number>`coalesce(sum(${generationRuns.costEstimate}), 0)::float8`,
      totalInputTokens: sql<number>`coalesce(sum(${generationRuns.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${generationRuns.outputTokens}), 0)::int`,
      completedRuns: count(),
    })
    .from(generationRuns)
    .where(eq(generationRuns.status, "completed"));

  const totalInputTokens = Number(row?.totalInputTokens ?? 0);
  const totalOutputTokens = Number(row?.totalOutputTokens ?? 0);

  return {
    totalCostUsd: Number(row?.totalCostUsd ?? 0),
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    completedRuns: Number(row?.completedRuns ?? 0),
  };
}
