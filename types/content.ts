/**
 * Modelos de LEITURA do conteúdo editorial — em snake_case, espelhando as
 * colunas retornadas pelo cliente Supabase (PostgREST). Usados pelo content
 * service e pelos componentes de render (components/content/*).
 *
 * O lado de ESCRITA do pipeline usa os tipos Drizzle camelCase (types/index.ts).
 */

export interface AdaptationExample {
  niche: string;
  example: string;
}

export interface EditionRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  platform_id: string;
  edition_date: string;
  status: string;
  review_status: string;
  published_at: string | null;
  content_expires_at: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface BriefingBlock {
  summary: string;
  whats_growing: string[];
  whats_saturated: string[];
  opportunities: string[];
  recommended_formats: string[];
  practical_recommendations: string[];
}

export interface TrendItemRow {
  id: string;
  edition_id: string;
  title: string;
  context: string;
  why_it_matters: string;
  adaptation_tips: string;
  risk_level: string;
  saturation_level: string;
  opportunity_score: number;
  content_format: string[];
  recommended_niches: string[];
  adaptation_examples: AdaptationExample[];
}

export interface ExploreReportRow {
  id: string;
  edition_id: string;
  title: string;
  summary: string;
  observed_patterns: string[];
  recommendation: string;
}

export interface CopyPatternRow {
  id: string;
  edition_id: string;
  title: string;
  observed_headline: string;
  category: string;
  hook_type: string;
  trigger_type: string;
  explanation: string;
  structure: string;
  adaptation_examples: AdaptationExample[];
  tags: string[];
}

export interface VisualPatternRow {
  id: string;
  edition_id: string;
  title: string;
  visual_style: string;
  colors: string[];
  typography_notes: string;
  composition_notes: string;
  why_it_works: string;
  how_to_adapt: string;
  tags: string[];
}

export interface HeadlineRow {
  id: string;
  edition_id: string;
  headline: string;
  category: string;
  trigger_type: string;
  why_it_works: string;
  adaptations: string[];
  saturation_level: string;
  recommended_niches: string[];
}

export interface ContentSuggestionRow {
  id: string;
  edition_id: string;
  title: string;
  central_idea: string;
  recommended_format: string;
  suggested_headline: string;
  post_structure: string;
  caption_base: string;
  cta: string;
  recommended_niches: string[];
  difficulty_level: string;
  opportunity_score: number;
  personalization_prompt: string;
}

export interface PromptTemplateRow {
  id: string;
  category_id: string;
  title: string;
  objective: string;
  when_to_use: string;
  required_input: string[];
  prompt_body: string;
  example_output: string;
  platform_id: string | null;
  tags: string[];
}

export interface PromptCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface PlatformRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

/** Edição publicada + todos os módulos (o que o dashboard renderiza). */
export interface EditionWithModules {
  edition: EditionRow;
  platform: PlatformRow | null;
  briefing: BriefingBlock | null;
  trend_items: TrendItemRow[];
  explore_reports: ExploreReportRow[];
  copy_patterns: CopyPatternRow[];
  visual_patterns: VisualPatternRow[];
  headlines: HeadlineRow[];
  content_suggestions: ContentSuggestionRow[];
}

export const FAVORITABLE = {
  trend_item: "Pauta",
  explore_report: "Radar",
  copy_pattern: "Copy",
  visual_pattern: "Visual",
  headline: "Headline",
  content_suggestion: "Sugestão",
  prompt_template: "Prompt",
} as const;
