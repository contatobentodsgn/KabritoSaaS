import { createClient } from "@/lib/supabase/server";
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

/** Edições aguardando revisão (draft / pending / in_review). */
export async function listReviewQueue(): Promise<EditionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_editions")
    .select("*")
    .in("review_status", ["pending", "in_review", "rejected"])
    .order("edition_date", { ascending: false });
  return (data as EditionRow[]) ?? [];
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
