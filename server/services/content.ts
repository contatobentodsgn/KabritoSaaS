import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_CARD_KEYS } from "@/lib/dashboard-cards";
import type {
  EditionRow,
  EditionWithModules,
  PlatformRow,
  TrendItemRow,
  HeadlineRow,
  PromptTemplateRow,
  PromptCategoryRow,
  ExploreReportRow,
  CopyPatternRow,
  VisualPatternRow,
  ContentSuggestionRow,
  BriefingBlock,
} from "@/types/content";

/**
 * Serviço de LEITURA do conteúdo editorial. SEMPRE via cliente Supabase (JWT)
 * → a RLS garante: só edições publicadas, não expiradas, e com assinatura ativa
 * (ou staff). Defesa em profundidade: as páginas também chamam
 * requireActiveSubscription(). (SECURITY_GUIDE §2/§3)
 */

export async function getPlatformBySlug(
  slug: string,
): Promise<PlatformRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PlatformRow) ?? null;
}

/**
 * Keys dos cards do dashboard ATIVOS (feature-flags). RLS: authenticated lê.
 * FAIL-OPEN: se a tabela ainda não existe (ex.: antes da migration 0010 rodar
 * na Supabase) ou a query erra, mostra TODOS os cards — nunca um dashboard vazio.
 * Lista vazia legítima (tabela existe, tudo desativado) é respeitada.
 */
export async function getEnabledCardKeys(): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dashboard_cards")
      .select("key")
      .eq("enabled", true);
    if (error) return new Set(DASHBOARD_CARD_KEYS); // fail-open
    return new Set((data as { key: string }[]).map((r) => r.key));
  } catch {
    return new Set(DASHBOARD_CARD_KEYS);
  }
}

/** Nichos (vocabulário de curadoria) para popular filtros. RLS: assinante/staff. */
export async function listNiches(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("niches")
    .select("slug, name")
    .order("name");
  return (data as { slug: string; name: string }[]) ?? [];
}

export async function listPlatforms(): Promise<PlatformRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .order("name");
  return (data as PlatformRow[]) ?? [];
}

export async function getLatestEdition(
  platformSlug = "instagram",
): Promise<EditionRow | null> {
  const supabase = await createClient();
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) return null;
  const { data } = await supabase
    .from("content_editions")
    .select("*")
    .eq("platform_id", platform.id)
    .eq("status", "published")
    .order("edition_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as EditionRow) ?? null;
}

export async function listEditions(
  platformSlug?: string,
  limit = 30,
): Promise<EditionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_editions")
    .select("*")
    .eq("status", "published")
    .order("edition_date", { ascending: false })
    .limit(limit);
  if (platformSlug) {
    const platform = await getPlatformBySlug(platformSlug);
    if (!platform) return [];
    query = query.eq("platform_id", platform.id);
  }
  const { data } = await query;
  return (data as EditionRow[]) ?? [];
}

export async function getEditionWithModules(
  editionId: string,
): Promise<EditionWithModules | null> {
  const supabase = await createClient();
  const { data: edition } = await supabase
    .from("content_editions")
    .select("*")
    .eq("id", editionId)
    .maybeSingle();
  if (!edition) return null; // RLS pode ter bloqueado → trata como inexistente

  const ed = edition as EditionRow & { briefing: BriefingBlock | null };
  const [platform, trends, explore, copy, visual, heads, suggestions] =
    await Promise.all([
      supabase.from("platforms").select("id, name, slug, is_active").eq("id", ed.platform_id).maybeSingle(),
      supabase.from("trend_items").select("*").eq("edition_id", editionId),
      supabase.from("explore_reports").select("*").eq("edition_id", editionId),
      supabase.from("copy_patterns").select("*").eq("edition_id", editionId),
      supabase.from("visual_patterns").select("*").eq("edition_id", editionId),
      supabase.from("headlines").select("*").eq("edition_id", editionId),
      supabase.from("content_suggestions").select("*").eq("edition_id", editionId),
    ]);

  return {
    edition: ed,
    platform: (platform.data as PlatformRow) ?? null,
    briefing: ed.briefing ?? null,
    trend_items: (trends.data as TrendItemRow[]) ?? [],
    explore_reports: (explore.data as ExploreReportRow[]) ?? [],
    copy_patterns: (copy.data as CopyPatternRow[]) ?? [],
    visual_patterns: (visual.data as VisualPatternRow[]) ?? [],
    headlines: (heads.data as HeadlineRow[]) ?? [],
    content_suggestions: (suggestions.data as ContentSuggestionRow[]) ?? [],
  };
}

export async function listHeadlines(limit = 60): Promise<HeadlineRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("headlines")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as HeadlineRow[]) ?? [];
}

export async function listTrends(limit = 60): Promise<TrendItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trend_items")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(limit);
  return (data as TrendItemRow[]) ?? [];
}

export async function listPrompts(): Promise<{
  categories: PromptCategoryRow[];
  prompts: PromptTemplateRow[];
}> {
  const supabase = await createClient();
  const [cats, prompts] = await Promise.all([
    supabase.from("prompt_categories").select("id, name, slug, description").order("name"),
    supabase.from("prompt_templates").select("*").order("title"),
  ]);
  return {
    categories: (cats.data as PromptCategoryRow[]) ?? [],
    prompts: (prompts.data as PromptTemplateRow[]) ?? [],
  };
}

/**
 * Resolve o slug de plataforma "atual" a partir de um query param, validando
 * contra as plataformas ATIVAS. Default = primeira ativa (ou instagram).
 * Usado pela UI multi-plataforma (MVP 2).
 */
export function resolvePlatformSlug(
  param: string | undefined,
  platforms: PlatformRow[],
): string {
  const slugs = platforms.map((p) => p.slug);
  if (param && slugs.includes(param)) return param;
  return slugs[0] ?? "instagram";
}
