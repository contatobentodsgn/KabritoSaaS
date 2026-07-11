import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import type {
  TrendItemRow,
  ExploreReportRow,
  CopyPatternRow,
  VisualPatternRow,
  HeadlineRow,
  ContentSuggestionRow,
  PromptTemplateRow,
} from "@/types/content";
import type { Database } from "@/types/supabase";

export interface FavoriteRow {
  id: string;
  entity_type: string;
  entity_id: string;
  collection_name: string | null;
  created_at: string;
}

/** Favoritos do usuário atual (RLS: user_id = auth.uid()). */
export async function listFavorites(): Promise<FavoriteRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_favorites")
    .select("id, entity_type, entity_id, collection_name, created_at")
    .order("created_at", { ascending: false });
  return (data as FavoriteRow[]) ?? [];
}

/** Conjunto "entityType:entityId" para marcar o estado favoritado na UI. */
export async function getFavoriteKeySet(): Promise<Set<string>> {
  const favs = await listFavorites();
  return new Set(favs.map((f) => `${f.entity_type}:${f.entity_id}`));
}

/** Nomes de coleção distintos do usuário (sem null), ordenados alfabeticamente. */
export async function listCollections(): Promise<string[]> {
  const favs = await listFavorites();
  const names = new Set<string>();
  for (const f of favs) {
    const name = f.collection_name?.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Mapa "entityType:entityId" -> collection_name (ou null) dos favoritos do
 * usuário. Permite à UI saber em qual coleção cada item favoritado está.
 */
export async function getFavoriteMeta(): Promise<Map<string, string | null>> {
  const favs = await listFavorites();
  return new Map(
    favs.map((f) => [`${f.entity_type}:${f.entity_id}`, f.collection_name]),
  );
}

export async function isFavorited(
  entityType: string,
  entityId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  return !!data;
}

export interface FavoritedContent {
  total: number;
  trend_item: TrendItemRow[];
  explore_report: ExploreReportRow[];
  copy_pattern: CopyPatternRow[];
  visual_pattern: VisualPatternRow[];
  headline: HeadlineRow[];
  content_suggestion: ContentSuggestionRow[];
  prompt_template: PromptTemplateRow[];
}

/**
 * Resolve os favoritos do usuário para os itens reais (RLS ainda aplicada: itens
 * não-publicados/expirados ou de outra pessoa não voltam). Itens que sumiram do
 * catálogo simplesmente não aparecem.
 */
export async function getFavoritedContent(): Promise<FavoritedContent> {
  const favs = await listFavorites();
  const byType: Record<string, string[]> = {};
  for (const f of favs) (byType[f.entity_type] ??= []).push(f.entity_id);

  const supabase = await createClient();
  async function fetchIn<T>(
    table: keyof Database["public"]["Tables"],
    ids?: string[],
  ): Promise<T[]> {
    if (!ids?.length) return [];
    const { data } = await supabase.from(table).select("*").in("id", ids);
    return (data as T[]) ?? [];
  }

  return {
    total: favs.length,
    trend_item: await fetchIn<TrendItemRow>("trend_items", byType.trend_item),
    explore_report: await fetchIn<ExploreReportRow>(
      "explore_reports",
      byType.explore_report,
    ),
    copy_pattern: await fetchIn<CopyPatternRow>(
      "copy_patterns",
      byType.copy_pattern,
    ),
    visual_pattern: await fetchIn<VisualPatternRow>(
      "visual_patterns",
      byType.visual_pattern,
    ),
    headline: await fetchIn<HeadlineRow>("headlines", byType.headline),
    content_suggestion: await fetchIn<ContentSuggestionRow>(
      "content_suggestions",
      byType.content_suggestion,
    ),
    prompt_template: await fetchIn<PromptTemplateRow>(
      "prompt_templates",
      byType.prompt_template,
    ),
  };
}
