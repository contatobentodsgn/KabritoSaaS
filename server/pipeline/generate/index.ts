import { z } from "zod";
import {
  safeParseGenerated,
  briefingSchema,
  trendItemSchema,
  exploreReportSchema,
  copyPatternSchema,
  visualPatternSchema,
  headlineSchema,
  contentSuggestionSchema,
  type Briefing,
  type TrendItem,
  type ExploreReport,
  type CopyPattern,
  type VisualPattern,
  type Headline,
  type ContentSuggestion,
} from "@/server/pipeline/schemas";
import {
  buildUserPrompt,
  PROMPT_VERSION,
  type GenModule,
  type PromptVars,
} from "@/server/pipeline/prompts";
import { getAiProvider, estimateCostUsd, type AiProvider } from "@/server/pipeline/ai/provider";

export class PipelineError extends Error {
  constructor(
    message: string,
    public module?: string,
    public kind: "invalid_output" | "cost_cap" | "ingest" | "persist" | "other" = "other",
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export interface GeneratedEdition {
  promptVersion: string;
  model: string;
  title: string;
  summary: string;
  briefing: Briefing;
  trend_items: TrendItem[];
  explore_reports: ExploreReport[];
  copy_patterns: CopyPattern[];
  visual_patterns: VisualPattern[];
  headlines: Headline[];
  content_suggestions: ContentSuggestion[];
  metrics: { inputTokens: number; outputTokens: number; costUsd: number };
}

export interface Caps {
  costCapUsd: number;
  tokenCap: number;
}

/** Gera + valida um módulo (com até 2 tentativas). Saída inválida nunca passa. */
async function genModule<T>(
  provider: AiProvider,
  module: GenModule,
  schema: z.ZodSchema<T>,
  vars: PromptVars,
  acc: { inputTokens: number; outputTokens: number; costUsd: number },
  caps: Caps,
): Promise<T> {
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    // No retry, realimenta o erro de validação para o modelo se autocorrigir.
    const userPrompt = buildUserPrompt(module, vars, attempt > 1 ? lastError : undefined);
    const call = await provider.generateModule(module, userPrompt, vars);
    acc.inputTokens += call.inputTokens;
    acc.outputTokens += call.outputTokens;
    acc.costUsd += estimateCostUsd(provider.model, call.inputTokens, call.outputTokens);

    // Teto de custo/tokens por run — estourou: para e alerta (não publica).
    if (acc.costUsd > caps.costCapUsd) {
      throw new PipelineError(
        `Teto de custo excedido (US$ ${acc.costUsd.toFixed(4)} > ${caps.costCapUsd}).`,
        module,
        "cost_cap",
      );
    }
    if (acc.inputTokens + acc.outputTokens > caps.tokenCap) {
      throw new PipelineError(`Teto de tokens excedido.`, module, "cost_cap");
    }

    const parsed = safeParseGenerated(schema, call.raw);
    if (parsed.ok) return parsed.data;
    lastError = parsed.error;
  }
  throw new PipelineError(
    `Saída inválida no módulo ${module}: ${lastError}`,
    module,
    "invalid_output",
  );
}

/**
 * Gera a edição completa, MÓDULO A MÓDULO (isola falhas/custo). Cada módulo é
 * validado por Zod; saída inválida nunca vira dado. Respeita o teto de custo.
 */
export async function generateEdition(vars: PromptVars, caps: Caps): Promise<GeneratedEdition> {
  const provider = getAiProvider();
  const acc = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  const briefing = await genModule(provider, "briefing", briefingSchema, vars, acc, caps);
  const trend_items = await genModule(provider, "trend_items", z.array(trendItemSchema).min(1), vars, acc, caps);
  const explore_reports = await genModule(provider, "explore_reports", z.array(exploreReportSchema).min(1), vars, acc, caps);
  const copy_patterns = await genModule(provider, "copy_patterns", z.array(copyPatternSchema).min(1), vars, acc, caps);
  const visual_patterns = await genModule(provider, "visual_patterns", z.array(visualPatternSchema).min(1), vars, acc, caps);
  const headlines = await genModule(provider, "headlines", z.array(headlineSchema).min(3), vars, acc, caps);
  const content_suggestions = await genModule(provider, "content_suggestions", z.array(contentSuggestionSchema).min(1), vars, acc, caps);

  return {
    promptVersion: PROMPT_VERSION,
    model: provider.model,
    title: `Inteligência Criativa — ${vars.platform} — ${vars.editionDate}`,
    summary: briefing.summary,
    briefing,
    trend_items,
    explore_reports,
    copy_patterns,
    visual_patterns,
    headlines,
    content_suggestions,
    metrics: acc,
  };
}
