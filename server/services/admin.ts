import { createClient } from "@/lib/supabase/server";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type {
  EditionRow,
  PlatformRow,
  PromptCategoryRow,
  PromptTemplateRow,
} from "@/types/content";

/**
 * Leituras do ADMIN. Via cliente Supabase em contexto de STAFF: as policies
 * "*_staff_all" permitem ler tudo (inclusive drafts e o pipeline interno). O
 * service-client (bypass RLS) fica reservado ao pipeline/cron. (SECURITY_GUIDE §3)
 */

export interface ReviewEditionRow extends EditionRow {
  platform_name?: string;
}

export interface QueueEdition extends EditionRow {
  counts: { trends: number; headlines: number; suggestions: number };
}

/** Prioridade de triagem: pendentes/em-revisão antes de rejeitadas. */
const QUEUE_ORDER: Record<string, number> = {
  pending: 0,
  in_review: 0,
  rejected: 1,
};

/**
 * Edições aguardando revisão, com contagem por módulo (contexto de triagem) e
 * ordenadas: pendentes primeiro, depois por data desc.
 */
export async function listReviewQueue(): Promise<QueueEdition[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_editions")
    .select("*")
    .in("review_status", ["pending", "in_review", "rejected"])
    .order("edition_date", { ascending: false })
    .limit(200); // teto defensivo: a fila não cresce ilimitada na resposta
  const editions = (data as EditionRow[]) ?? [];
  if (editions.length === 0) return [];

  // Conta os 3 módulos principais em 3 queries (não N×M) e agrega em memória.
  const ids = editions.map((e) => e.id);
  const tally = async (table: string): Promise<Map<string, number>> => {
    const { data } = await supabase
      .from(table)
      .select("edition_id")
      .in("edition_id", ids);
    const m = new Map<string, number>();
    for (const r of (data as { edition_id: string }[] | null) ?? []) {
      m.set(r.edition_id, (m.get(r.edition_id) ?? 0) + 1);
    }
    return m;
  };
  const [t, h, s] = await Promise.all([
    tally("trend_items"),
    tally("headlines"),
    tally("content_suggestions"),
  ]);

  return editions
    .map((e) => ({
      ...e,
      counts: {
        trends: t.get(e.id) ?? 0,
        headlines: h.get(e.id) ?? 0,
        suggestions: s.get(e.id) ?? 0,
      },
    }))
    .sort(
      (a, b) =>
        (QUEUE_ORDER[a.review_status] ?? 0) -
        (QUEUE_ORDER[b.review_status] ?? 0),
    );
}

/**
 * Motivo da última rejeição de uma edição (gravado em audit_logs, não em coluna).
 * Usado para mostrar ao revisor o feedback anterior na re-revisão.
 */
export async function getLatestRejectionReason(
  editionId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("metadata")
    .eq("entity_type", "content_edition")
    .eq("entity_id", editionId)
    .eq("action", AUDIT_ACTIONS.CONTENT_REJECTED)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const reason = (data as { metadata?: { reason?: unknown } } | null)?.metadata
    ?.reason;
  return typeof reason === "string" ? reason : null;
}

export interface SourceRow {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
}

export async function listSources(): Promise<SourceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingestion_sources")
    .select("id, name, type, config, is_active, last_run_at")
    .order("name");
  return (data as SourceRow[]) ?? [];
}

/** Cards do dashboard NA ORDEM (sort_order) com estado, para a tela de admin. */
export async function listCardFlags(): Promise<
  { key: string; enabled: boolean; sortOrder: number }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_cards")
    .select("key, enabled, sort_order")
    .order("sort_order");
  return (
    (
      data as { key: string; enabled: boolean; sort_order: number }[] | null
    )?.map((r) => ({
      key: r.key,
      enabled: r.enabled,
      sortOrder: r.sort_order,
    })) ?? []
  );
}

export async function listAllPlatforms(): Promise<PlatformRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("id, name, slug, is_active")
    .order("name");
  return (data as PlatformRow[]) ?? [];
}

export interface NicheRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function listNiches(): Promise<NicheRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("niches")
    .select("id, name, slug, description")
    .order("name");
  return (data as NicheRow[]) ?? [];
}

export interface TagRow {
  id: string;
  name: string;
  slug: string;
}

export async function listTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_tags")
    .select("id, name, slug")
    .order("name");
  return (data as TagRow[]) ?? [];
}

export async function listCategories(): Promise<PromptCategoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_categories")
    .select("id, name, slug, description")
    .order("name");
  return (data as PromptCategoryRow[]) ?? [];
}

export async function listTemplates(): Promise<PromptTemplateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select("*")
    .order("title");
  return (data as PromptTemplateRow[]) ?? [];
}

export interface RunRow {
  id: string;
  edition_date: string;
  platform_id: string;
  status: string;
  prompt_version: string | null;
  model_used: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_estimate: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export async function listRuns(limit = 50): Promise<RunRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generation_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data as RunRow[]) ?? [];
}
