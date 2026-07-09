/**
 * generation-schemas.ts
 * ----------------------------------------------------------------------------
 * Schemas Zod que definem a SAÍDA esperada da IA em cada módulo do pipeline.
 *
 * Regra do pipeline: o modelo é instruído a responder SOMENTE com JSON que
 * satisfaça estes schemas. Toda saída passa por `safeParse`. Se falhar, o item
 * é descartado/reprocessado e NUNCA é gravado cru no banco.
 *
 * Convenção:
 *  - Nomes de campos em inglês (espelham o schema do banco).
 *  - Valores de enum em pt-BR onde fazem parte do domínio editorial.
 *  - Local sugerido: server/pipeline/schemas/generation-schemas.ts
 * ----------------------------------------------------------------------------
 */

import { z } from "zod";

/* ===========================================================================
 * 1) ENUMS / VOCABULÁRIO CONTROLADO
 * ===========================================================================
 * Manter o vocabulário fechado evita que a IA invente categorias e quebra a
 * filtragem/exibição no front. Ajuste os valores conforme o produto evoluir.
 */

export const platformSlug = z.enum([
  "instagram",
  "linkedin",
  "threads",
  "tiktok",
]);

export const riskLevel = z.enum(["baixo", "medio", "alto"]);

export const saturationLevel = z.enum([
  "emergente", // oportunidade nova, pouca gente fazendo
  "baixo",
  "medio",
  "alto",
  "saturado", // já está em todo lugar
]);

export const contentFormat = z.enum([
  "carrossel",
  "reels",
  "post_unico",
  "thread",
  "post_linkedin",
  "story",
  "sequencia_stories",
  "roteiro_curto",
  "post_opiniao",
  "post_educativo",
  "post_venda",
]);

export const copyCategory = z.enum([
  "autoridade",
  "identificacao",
  "polemica",
  "quebra_de_crenca",
  "tutorial",
  "lista",
  "bastidor",
  "opiniao",
  "venda",
]);

export const triggerType = z.enum([
  "curiosidade",
  "medo_de_errar",
  "prova_social",
  "urgencia",
  "novidade",
  "identificacao",
  "autoridade",
  "polemica",
  "ganho",
  "perda",
]);

export const difficultyLevel = z.enum(["facil", "medio", "dificil"]);

/** Score 0–100. opportunity_score alto = boa janela com baixa saturação. */
export const score0to100 = z.number().int().min(0).max(100);

/**
 * Nichos: vocabulário aberto mas normalizado para slug.
 * O pipeline deve mapear contra a tabela `niches`; valores fora da lista
 * conhecida podem ser logados para curadoria.
 */
export const nicheSlug = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "use slug em minúsculas, hífens, sem acento");

export const tagSlug = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "use slug em minúsculas, hífens, sem acento");

/* ---------------------------------------------------------------------------
 * NORMALIZAÇÃO DEFENSIVA (tolerância a modelos, sobretudo menores/grátis)
 * ---------------------------------------------------------------------------
 * Modelos erram o FORMATO dos enums/slugs ("prova social" → "prova_social",
 * "Quebra de Crença" → "quebra_de_crenca", tags com acento/maiúscula). Aqui
 * normalizamos ANTES de validar. Valor fora do vocabulário ainda falha (isso é
 * corrigido instruindo os valores permitidos no prompt) — só o formato é coagido.
 */
const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const normEnumStr = (s: string) =>
  stripAccents(s.trim().toLowerCase())
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const toSlugStr = (s: string) =>
  stripAccents(s.trim().toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const preNorm = (v: unknown) => (typeof v === "string" ? normEnumStr(v) : v);
const preSlug = (v: unknown) => (typeof v === "string" ? toSlugStr(v) : v);
/**
 * Enum/slug TOLERANTE: normaliza o FORMATO antes de validar (corrige "prova social"
 * → "prova_social", acentos, etc.). Valor fora do vocabulário ainda falha (resolvido
 * via prompt). O cast para o schema original preserva o tipo de saída (union/slug) —
 * o z.preprocess sozinho infere `unknown` e quebra a tipagem em run.ts.
 */
const loose = <T extends z.ZodTypeAny>(e: T): T =>
  z.preprocess(preNorm, e) as unknown as T;
const tagSlugLoose = z.preprocess(
  preSlug,
  tagSlug,
) as unknown as typeof tagSlug;
const nicheSlugLoose = z.preprocess(
  preSlug,
  nicheSlug,
) as unknown as typeof nicheSlug;

/* ===========================================================================
 * 2) PRIMITIVOS REUTILIZÁVEIS
 * ===========================================================================
 */

const shortText = z.string().trim().min(3).max(160);
const mediumText = z.string().trim().min(10).max(600);
const longText = z.string().trim().min(10).max(2000);

/** Exemplos de adaptação de uma estrutura para nichos diferentes. */
const adaptationExample = z.object({
  niche: nicheSlugLoose,
  example: shortText,
});

/* ===========================================================================
 * 3) SCHEMAS POR MÓDULO  (1 edição = vários destes)
 * ===========================================================================
 */

/* --- 3.1 Briefing diário ---------------------------------------------------
 * O "coração" da edição. Resumo do dia + seções de leitura/contexto.
 */
export const briefingSchema = z.object({
  summary: mediumText, // resumo do dia em 1–3 frases
  whats_growing: z.array(shortText).min(1).max(6),
  whats_saturated: z.array(shortText).min(0).max(6),
  opportunities: z.array(shortText).min(1).max(6),
  recommended_formats: z.array(loose(contentFormat)).min(1).max(6),
  practical_recommendations: z.array(shortText).min(1).max(6),
});
export type Briefing = z.infer<typeof briefingSchema>;

/* --- 3.2 Pauta quente (trend_items) --------------------------------------- */
export const trendItemSchema = z.object({
  title: shortText,
  context: mediumText, // o que é / por que surgiu
  why_it_matters: mediumText,
  adaptation_tips: longText, // como virar conteúdo
  risk_level: loose(riskLevel),
  saturation_level: loose(saturationLevel),
  opportunity_score: score0to100,
  content_format: z.array(loose(contentFormat)).min(1).max(5),
  recommended_niches: z.array(nicheSlugLoose).min(1).max(12),
  adaptation_examples: z.array(adaptationExample).min(1).max(6),
});
export type TrendItem = z.infer<typeof trendItemSchema>;

/* --- 3.3 Radar de Descoberta (explore_reports) ----------------------------
 * Padrões observados em fontes legais (NÃO scraping). Texto + lista.
 */
export const exploreReportSchema = z.object({
  title: shortText,
  summary: mediumText,
  observed_patterns: z.array(shortText).min(2).max(10),
  recommendation: mediumText,
});
export type ExploreReport = z.infer<typeof exploreReportSchema>;

/* --- 3.4 Análise de copy (copy_patterns) ---------------------------------- */
export const copyPatternSchema = z.object({
  title: shortText,
  observed_headline: shortText,
  category: loose(copyCategory),
  hook_type: shortText, // ex.: "pergunta provocativa"
  trigger_type: loose(triggerType),
  explanation: mediumText, // por que chama atenção
  structure: shortText, // ex.: "Você está fazendo X do jeito errado"
  adaptation_examples: z.array(adaptationExample).min(2).max(8),
  tags: z.array(tagSlugLoose).min(1).max(8),
});
export type CopyPattern = z.infer<typeof copyPatternSchema>;

/* --- 3.5 Análise visual (visual_patterns) --------------------------------- */
export const visualPatternSchema = z.object({
  title: shortText, // padrão detectado
  visual_style: shortText, // ex.: "minimalista editorial"
  colors: z.array(shortText).min(1).max(6), // descrição, não hex obrigatório
  typography_notes: mediumText,
  composition_notes: mediumText,
  why_it_works: mediumText,
  how_to_adapt: mediumText,
  tags: z.array(tagSlugLoose).min(1).max(8),
});
export type VisualPattern = z.infer<typeof visualPatternSchema>;

/* --- 3.6 Headlines (headlines) -------------------------------------------- */
export const headlineSchema = z.object({
  headline: shortText,
  category: shortText, // ex.: "alerta / quebra de padrão"
  trigger_type: loose(triggerType),
  why_it_works: mediumText,
  adaptations: z.array(shortText).min(2).max(10),
  saturation_level: loose(saturationLevel),
  recommended_niches: z.array(nicheSlugLoose).min(1).max(12),
});
export type Headline = z.infer<typeof headlineSchema>;

/* --- 3.7 Sugestões de posts (content_suggestions) ------------------------- */
export const contentSuggestionSchema = z.object({
  title: shortText,
  central_idea: mediumText,
  recommended_format: loose(contentFormat),
  suggested_headline: shortText,
  post_structure: longText, // estrutura passo a passo / slides
  caption_base: longText, // legenda base
  cta: shortText,
  recommended_niches: z.array(nicheSlugLoose).min(1).max(12),
  difficulty_level: loose(difficultyLevel),
  opportunity_score: score0to100,
  personalization_prompt: mediumText, // prompt p/ o usuário adaptar ao nicho
});
export type ContentSuggestion = z.infer<typeof contentSuggestionSchema>;

/* --- 3.8 Prompts (prompt_templates) ---------------------------------------
 * Em geral curados/evergreen, mas o pipeline pode sugerir novos para revisão.
 */
export const promptTemplateSchema = z.object({
  title: shortText,
  category_slug: tagSlug, // mapeia para prompt_categories
  objective: shortText,
  when_to_use: mediumText,
  required_input: z.array(shortText).min(0).max(8),
  prompt_body: longText,
  example_output: longText,
  tags: z.array(tagSlugLoose).min(1).max(8),
});
export type PromptTemplate = z.infer<typeof promptTemplateSchema>;

/* ===========================================================================
 * 4) SCHEMA COMPOSTO DA EDIÇÃO DIÁRIA
 * ===========================================================================
 * Saída completa de um `generation_run` para uma plataforma/dia.
 * O orquestrador pode gerar tudo de uma vez OU módulo a módulo (recomendado:
 * módulo a módulo, para isolar falhas e custo). Este schema valida o agregado.
 */
export const editionGenerationSchema = z.object({
  platform: platformSlug,
  edition_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD"),
  title: shortText,
  summary: mediumText,

  briefing: briefingSchema,
  trend_items: z.array(trendItemSchema).min(1).max(8),
  explore_reports: z.array(exploreReportSchema).min(1).max(4),
  copy_patterns: z.array(copyPatternSchema).min(1).max(6),
  visual_patterns: z.array(visualPatternSchema).min(1).max(6),
  headlines: z.array(headlineSchema).min(3).max(20),
  content_suggestions: z.array(contentSuggestionSchema).min(1).max(10),
  prompt_suggestions: z.array(promptTemplateSchema).min(0).max(6), // opcional

  // Metadados que o gerador deve devolver para rastreabilidade:
  meta: z.object({
    prompt_version: z.string().min(1),
    model_used: z.string().min(1),
    notes_for_reviewer: z.string().max(1000).optional(),
  }),
});
export type EditionGeneration = z.infer<typeof editionGenerationSchema>;

/* ===========================================================================
 * 5) WRAPPER DE PARSE SEGURO + LIMPEZA DE CERCAS DE CÓDIGO
 * ===========================================================================
 * A IA às vezes embrulha o JSON em ```json ... ```. Limpamos antes de parsear.
 */

export function stripCodeFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

export function safeParseGenerated<T>(
  schema: z.ZodSchema<T>,
  raw: string,
): ParseResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFences(raw));
  } catch {
    return { ok: false, error: "Saída não é JSON válido após limpeza." };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // Achata os erros do Zod para logar em generation_runs.error_message
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" | ");
    return { ok: false, error: issues };
  }
  return { ok: true, data: parsed.data };
}

/* ===========================================================================
 * 6) PADRÃO DE INSTRUÇÃO PARA O MODELO (referência)
 * ===========================================================================
 * Use no system prompt de CADA gerador. O ponto-chave é exigir JSON puro.
 *
 *   SYSTEM:
 *   "Você é um gerador de conteúdo editorial. Responda SOMENTE com um objeto
 *    JSON válido que satisfaça exatamente o schema fornecido. Não inclua texto
 *    fora do JSON, não use crases, não explique. Todos os enums devem usar
 *    EXATAMENTE os valores permitidos. Slugs em minúsculas, sem acento."
 *
 * Recomendado: gerar módulo a módulo (briefingSchema, depois trendItemSchema[],
 * etc.), validando cada parte. Isso isola falhas, reduz custo por chamada e
 * facilita reprocessar só o módulo que quebrou — em vez de a edição inteira.
 *
 * Exemplo de uso no orquestrador:
 *
 *   const raw = await callModel(systemPrompt, userPrompt);
 *   const result = safeParseGenerated(trendItemSchema, raw);
 *   if (!result.ok) {
 *     await markRunIssue(runId, "trend_items", result.error);
 *     // reprocessa este módulo ou marca para revisão manual
 *   } else {
 *     await persistTrendItemDraft(editionId, result.data);
 *   }
 */
