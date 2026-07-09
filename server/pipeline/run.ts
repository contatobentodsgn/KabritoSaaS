import "server-only";
import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  contentEditions,
  generationRuns,
  niches as nichesTable,
  trendItems,
  exploreReports,
  copyPatterns,
  visualPatterns,
  headlines as headlinesTable,
  contentSuggestions,
} from "@/db/schema";
import { contentFormat } from "@/server/pipeline/schemas";
import { runIngestion } from "@/server/pipeline/ingest";
import {
  generateEdition,
  PipelineError,
  type Caps,
} from "@/server/pipeline/generate";
import type { PromptVars } from "@/server/pipeline/prompts";
import { serverEnv } from "@/server/env";
import { slugify } from "@/lib/utils/slug";

/**
 * ============================================================================
 * ORQUESTRADOR DO CICLO DIÁRIO (PROJECT §2/§6, TECHNICAL_SPEC §5)
 *   ingest → generate (Zod, módulo a módulo) → DRAFT (review_status=pending)
 * ============================================================================
 * Garantias:
 *  - Idempotência por (platform_id, edition_date) — rodar 2x não duplica.
 *  - Teto de custo/tokens por run — estourou: para, marca failed, NÃO publica.
 *  - FALHA NUNCA PUBLICA: o pior caso é "não saiu edição hoje". Tudo nasce draft
 *    e só vai ao ar após aprovação humana na fila de revisão.
 *  - Roda com service_role ISOLADO (este módulo está em server/pipeline/).
 */

export interface RunResult {
  ok: boolean;
  runId: string;
  editionId?: string;
  skipped?: boolean;
  error?: string;
  metrics?: { inputTokens: number; outputTokens: number; costUsd: number };
}

export async function runDailyGeneration(opts: {
  platformId: string;
  platformSlug: string;
  editionDate: string; // YYYY-MM-DD
  caps?: Partial<Caps>;
}): Promise<RunResult> {
  const db = getServiceDbClient();
  // Guard de finitude: `??` faz fallback só em null/undefined, NÃO em NaN. Um cap
  // NaN tornaria a comparação de teto sempre false e desligaria o limite. Aqui um
  // override inválido (NaN/≤0) cai no env (que já é validado por numEnv).
  const cap = (v: number | undefined, fb: number) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fb;
  const caps: Caps = {
    costCapUsd: cap(opts.caps?.costCapUsd, serverEnv.AI_RUN_COST_CAP_USD),
    tokenCap: cap(opts.caps?.tokenCap, serverEnv.AI_RUN_TOKEN_CAP),
  };

  // Idempotência: já existe edição para (plataforma, data)?
  const existing = await db
    .select({ id: contentEditions.id })
    .from(contentEditions)
    .where(
      and(
        eq(contentEditions.platformId, opts.platformId),
        eq(contentEditions.editionDate, opts.editionDate),
      ),
    )
    .limit(1);

  // generation_run sempre é criado (auditoria de tentativa/custo)
  const [run] = await db
    .insert(generationRuns)
    .values({
      editionDate: opts.editionDate,
      platformId: opts.platformId,
      status: "started",
    })
    .returning({ id: generationRuns.id });
  const runId = run!.id;

  if (existing[0]) {
    await db
      .update(generationRuns)
      .set({
        status: "completed",
        finishedAt: new Date(),
        errorMessage: "skipped: já existe edição",
      })
      .where(eq(generationRuns.id, runId));
    return { ok: true, runId, editionId: existing[0].id, skipped: true };
  }

  try {
    // Vars de prompt
    const nicheRows = await db
      .select({ slug: nichesTable.slug })
      .from(nichesTable);
    const vars: PromptVars = {
      platform: opts.platformSlug,
      editionDate: opts.editionDate,
      signals: "",
      niches: nicheRows.map((n) => n.slug),
      formats: [...contentFormat.options],
    };

    // 1) Ingestão
    await db
      .update(generationRuns)
      .set({ status: "ingesting" })
      .where(eq(generationRuns.id, runId));
    const ingest = await runIngestion(runId, opts.platformId);
    vars.signals = ingest.signalsSummary;

    // 2) Geração (Zod por módulo) + teto de custo
    await db
      .update(generationRuns)
      .set({ status: "generating", promptVersion: undefined })
      .where(eq(generationRuns.id, runId));
    const gen = await generateEdition(vars, caps);

    // 3) Persistência transacional como DRAFT (review_status=pending)
    const editionId = await db.transaction(async (tx) => {
      const [edition] = await tx
        .insert(contentEditions)
        .values({
          title: gen.title,
          slug: `${slugify(opts.platformSlug)}-${opts.editionDate}`,
          summary: gen.summary,
          briefing: gen.briefing,
          platformId: opts.platformId,
          editionDate: opts.editionDate,
          status: "draft",
          reviewStatus: "pending",
          generatedByRunId: runId,
          generationPromptVersion: gen.promptVersion,
        })
        .returning({ id: contentEditions.id });
      const eid = edition!.id;

      if (gen.trend_items.length)
        await tx.insert(trendItems).values(
          gen.trend_items.map((t) => ({
            editionId: eid,
            platformId: opts.platformId,
            title: t.title,
            context: t.context,
            whyItMatters: t.why_it_matters,
            adaptationTips: t.adaptation_tips,
            riskLevel: t.risk_level,
            saturationLevel: t.saturation_level,
            opportunityScore: t.opportunity_score,
            contentFormat: t.content_format,
            recommendedNiches: t.recommended_niches,
            adaptationExamples: t.adaptation_examples,
          })),
        );

      if (gen.explore_reports.length)
        await tx.insert(exploreReports).values(
          gen.explore_reports.map((r) => ({
            editionId: eid,
            platformId: opts.platformId,
            title: r.title,
            summary: r.summary,
            observedPatterns: r.observed_patterns,
            recommendation: r.recommendation,
          })),
        );

      if (gen.copy_patterns.length)
        await tx.insert(copyPatterns).values(
          gen.copy_patterns.map((c) => ({
            editionId: eid,
            title: c.title,
            observedHeadline: c.observed_headline,
            category: c.category,
            hookType: c.hook_type,
            triggerType: c.trigger_type,
            explanation: c.explanation,
            structure: c.structure,
            adaptationExamples: c.adaptation_examples,
            tags: c.tags,
          })),
        );

      if (gen.visual_patterns.length)
        await tx.insert(visualPatterns).values(
          gen.visual_patterns.map((v) => ({
            editionId: eid,
            title: v.title,
            visualStyle: v.visual_style,
            colors: v.colors,
            typographyNotes: v.typography_notes,
            compositionNotes: v.composition_notes,
            whyItWorks: v.why_it_works,
            howToAdapt: v.how_to_adapt,
            tags: v.tags,
          })),
        );

      if (gen.headlines.length)
        await tx.insert(headlinesTable).values(
          gen.headlines.map((h) => ({
            editionId: eid,
            headline: h.headline,
            category: h.category,
            triggerType: h.trigger_type,
            whyItWorks: h.why_it_works,
            adaptations: h.adaptations,
            saturationLevel: h.saturation_level,
            recommendedNiches: h.recommended_niches,
          })),
        );

      if (gen.content_suggestions.length)
        await tx.insert(contentSuggestions).values(
          gen.content_suggestions.map((s) => ({
            editionId: eid,
            title: s.title,
            centralIdea: s.central_idea,
            recommendedFormat: s.recommended_format,
            suggestedHeadline: s.suggested_headline,
            postStructure: s.post_structure,
            captionBase: s.caption_base,
            cta: s.cta,
            recommendedNiches: s.recommended_niches,
            difficultyLevel: s.difficulty_level,
            opportunityScore: s.opportunity_score,
            personalizationPrompt: s.personalization_prompt,
          })),
        );

      return eid;
    });

    // 4) Run completo (auditoria de custo/tokens)
    await db
      .update(generationRuns)
      .set({
        status: "completed",
        modelUsed: gen.model,
        promptVersion: gen.promptVersion,
        inputTokens: gen.metrics.inputTokens,
        outputTokens: gen.metrics.outputTokens,
        costEstimate: gen.metrics.costUsd.toFixed(4),
        finishedAt: new Date(),
      })
      .where(eq(generationRuns.id, runId));

    return { ok: true, runId, editionId, metrics: gen.metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const kind = err instanceof PipelineError ? err.kind : "other";
    await db
      .update(generationRuns)
      .set({
        status: "failed",
        errorMessage: `[${kind}] ${message}`,
        finishedAt: new Date(),
      })
      .where(eq(generationRuns.id, runId));
    // FALHA NÃO PUBLICA: nenhuma edição foi persistida (ou a tx fez rollback).
    console.error("[pipeline] run falhou:", message);
    // Alerta para a equipe (Sentry, se configurado) — falha de geração é crítica.
    // Guard: no runtime do CLI (tsx + react-server) captureException pode não
    // existir; no cron (Next/Node) existe. Nunca deixar o alerta quebrar o run.
    if (typeof Sentry.captureException === "function") {
      Sentry.captureException(err, {
        tags: { area: "pipeline", kind },
        extra: {
          runId,
          editionDate: opts.editionDate,
          platform: opts.platformSlug,
        },
      });
    }
    return { ok: false, runId, error: message };
  }
}
