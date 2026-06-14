/**
 * Prompts VERSIONADOS do pipeline (fonte: pipeline/generator-prompts.md).
 * Cada generation_run grava `prompt_version` (CURRENT_PROMPT_VERSION) para
 * rastrear qual versão gerou qual qualidade e permitir reverter.
 */
import { CURRENT_PROMPT_VERSION } from "@/lib/constants";

export const PROMPT_VERSION = CURRENT_PROMPT_VERSION;

export const SYSTEM_BASE = `Você é um gerador de inteligência criativa para criadores de conteúdo e social media.
Responda SOMENTE com um objeto JSON válido que satisfaça EXATAMENTE o schema indicado.
Não inclua texto fora do JSON, não use crases, não explique.
Use apenas os valores de enum permitidos. Slugs em minúsculas, sem acento, com hífen.
Escreva em português do Brasil. Seja específico e aplicável; evite generalidades.
Não invente dados de redes sociais; baseie-se apenas nos sinais fornecidos e em conhecimento de copy/design.`;

export interface PromptVars {
  platform: string;
  editionDate: string;
  signals: string;
  niches: string[];
  formats: string[];
}

export type GenModule =
  | "briefing"
  | "trend_items"
  | "explore_reports"
  | "copy_patterns"
  | "visual_patterns"
  | "headlines"
  | "content_suggestions";

const COMMON = (v: PromptVars) =>
  `Plataforma: ${v.platform} | Data: ${v.editionDate}\nSinais do dia:\n${v.signals || "(sem sinais coletados; use padrões atemporais de copy/design)"}\nNichos válidos: ${v.niches.join(", ") || "(livre)"} | Formatos válidos: ${v.formats.join(", ")}`;

export function buildUserPrompt(module: GenModule, v: PromptVars): string {
  switch (module) {
    case "briefing":
      return `${COMMON(v)}\n\nGere o briefing diário com: summary (1–3 frases), whats_growing, whats_saturated, opportunities, recommended_formats (use apenas os formatos válidos), practical_recommendations. Foque no que é acionável hoje.\nSaída: JSON conforme briefingSchema.`;
    case "trend_items":
      return `${COMMON(v)}\n\nGere de 3 a 6 pautas quentes. Cada uma: title, context, why_it_matters, adaptation_tips, risk_level (baixo|medio|alto), saturation_level (emergente|baixo|medio|alto|saturado), opportunity_score (0–100), content_format (subset válido), recommended_niches (subset válido), adaptation_examples (2–6 niche+example). Inclua ao menos uma pauta "emergente".\nSaída: JSON array conforme trendItemSchema.`;
    case "explore_reports":
      return `${COMMON(v)}\n\nGere de 1 a 3 análises de padrões observados (formatos, ganchos, estilos), SEM afirmar captura automática de redes. Cada uma: title, summary, observed_patterns (2–10), recommendation.\nSaída: JSON array conforme exploreReportSchema.`;
    case "copy_patterns":
      return `${COMMON(v)}\n\nGere de 2 a 5 análises de copy. Cada uma: title, observed_headline, category, hook_type, trigger_type, explanation, structure (molde reutilizável), adaptation_examples (2–8 niche+example), tags.\nSaída: JSON array conforme copyPatternSchema.`;
    case "visual_patterns":
      return `${COMMON(v)}\n\nGere de 1 a 4 padrões visuais. Cada um: title, visual_style, colors (descrições), typography_notes, composition_notes, why_it_works, how_to_adapt, tags. Foque em reproduzível por não-designers.\nSaída: JSON array conforme visualPatternSchema.`;
    case "headlines":
      return `${COMMON(v)}\n\nGere de 5 a 12 headlines. Cada uma: headline, category, trigger_type, why_it_works, adaptations (2–10), saturation_level, recommended_niches. Varie os gatilhos.\nSaída: JSON array conforme headlineSchema.`;
    case "content_suggestions":
      return `${COMMON(v)}\n\nGere de 3 a 6 sugestões de post. Cada uma: title, central_idea, recommended_format, suggested_headline, post_structure, caption_base, cta, recommended_niches, difficulty_level (facil|medio|dificil), opportunity_score (0–100), personalization_prompt.\nSaída: JSON array conforme contentSuggestionSchema.`;
  }
}
