"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { requireAal2 } from "@/server/auth/mfa";
import { canReviewContent, canManagePipeline } from "@/server/permissions";
import { recordAudit } from "@/server/audit/log";
import { sendEditionDigest } from "@/server/admin/notify";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { DASHBOARD_CARD_KEYS } from "@/lib/dashboard-cards";
import {
  rejectionSchema,
  editionEditSchema,
  itemEditSchema,
  itemDeleteSchema,
  sourceSchema,
  platformSchema,
  nicheSchema,
  tagSchema,
  categorySchema,
  templateSchema,
  EDITABLE_ITEM_TABLES,
} from "@/lib/validations/admin";
import type { FormState } from "@/server/actions/types";
import type { Json } from "@/types/supabase";

export type ActionResult = { ok: true } | { ok: false; error: string };
const forbidden = (): ActionResult => ({ ok: false, error: "Não autorizado." });
const csv = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/* ===========================================================================
 * FILA DE REVISÃO (editor/superadmin) — nada publica sem aprovação humana.
 * =========================================================================== */

export async function approveEdition(editionId: string): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const aal2 = await requireAal2();
  if (!aal2.ok) return aal2;
  if (!z.string().uuid().safeParse(editionId).success)
    return { ok: false, error: "ID inválido." };

  const user = await getCurrentUser();
  if (!user) return forbidden();
  const supabase = await createClient();

  // content_expires_at = now + plans.retention_days (plano único)
  const { data: plan } = await supabase
    .from("plans")
    .select("retention_days")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const retentionDays = (plan?.retention_days as number) ?? 60;
  const now = new Date();
  const expires = new Date(now.getTime() + retentionDays * 86_400_000);

  // Publicação ATÔMICA (G7): a função approve_edition faz o UPDATE (gated a
  // 'pending', G8) + INSERT na auditoria numa única transação — toda publicação
  // tem trilha. FALLBACK p/ o caminho legado se a função ainda não existir no
  // banco (migration 0013 não aplicada, ou ainda fora do schema cache do
  // PostgREST → erro PGRST202) — deploy seguro independente da ordem
  // migration↔deploy.
  const rpc = await supabase.rpc("approve_edition", {
    p_edition_id: editionId,
    p_reviewer: user.id,
    p_expires: expires.toISOString(),
  });

  if (!rpc.error) {
    if (Number(rpc.data ?? 0) === 0) {
      return { ok: false, error: "Esta edição não está aguardando aprovação." };
    }
  } else if (rpc.error.code === "PGRST202") {
    // Função ausente → caminho legado (UPDATE + audit separados).
    const { data: updated, error } = await supabase
      .from("content_editions")
      .update({
        status: "published",
        review_status: "approved",
        published_at: now.toISOString(),
        reviewed_by: user.id,
        reviewed_at: now.toISOString(),
        content_expires_at: expires.toISOString(),
      })
      .eq("id", editionId)
      .eq("review_status", "pending")
      .select("id");
    if (error) return { ok: false, error: "Falha ao publicar." };
    if (!updated || updated.length === 0) {
      return { ok: false, error: "Esta edição não está aguardando aprovação." };
    }
    await recordAudit({
      action: AUDIT_ACTIONS.CONTENT_PUBLISHED,
      entityType: "content_edition",
      entityId: editionId,
    });
  } else {
    return { ok: false, error: "Falha ao publicar." };
  }

  // Digest: job de SISTEMA (fan-out a todos os assinantes), isolado em
  // server/admin com service_role. Best-effort: nunca quebra a publicação.
  await sendEditionDigest(editionId);

  revalidatePath("/admin/review");
  revalidatePath("/daily-briefing");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function rejectEdition(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = rejectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Motivo obrigatório." };

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_editions")
    .update({
      review_status: "rejected",
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.editionId);
  if (error) return { ok: false, error: "Falha ao rejeitar." };

  // motivo registrado (feedback p/ ajuste de prompt) — em audit_logs
  await recordAudit({
    action: AUDIT_ACTIONS.CONTENT_REJECTED,
    entityType: "content_edition",
    entityId: parsed.data.editionId,
    metadata: { reason: parsed.data.reason },
  });
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function updateEditionMeta(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = editionEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_editions")
    .update({ title: parsed.data.title, summary: parsed.data.summary || null })
    .eq("id", parsed.data.editionId);
  if (error) return { ok: false, error: "Falha ao salvar." };
  await recordAudit({
    action: AUDIT_ACTIONS.CONTENT_EDITED,
    entityType: "content_edition",
    entityId: parsed.data.editionId,
  });
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function updateItemField(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = itemEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };
  const { table, id, field, value } = parsed.data;
  // whitelist de campo por tabela (defesa contra update arbitrário)
  const allowed = EDITABLE_ITEM_TABLES[table] as readonly string[];
  if (!allowed.includes(field))
    return { ok: false, error: "Campo não editável." };

  const supabase = await createClient();
  // `field` é dinâmico (checado contra `allowed` acima, não uma coluna
  // literal) — o Update tipado de nenhuma tabela cobre uma chave computada,
  // então o `as never` é o escape hatch aqui; a whitelist é a rede de
  // segurança real, não o tipo.
  const { error } = await supabase
    .from(table)
    .update({ [field]: value } as never)
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao editar item." };
  await recordAudit({
    action: AUDIT_ACTIONS.CONTENT_EDITED,
    entityType: table,
    entityId: id,
  });
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function deleteItem(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = itemDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from(parsed.data.table)
    .delete()
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Falha ao remover item." };
  await recordAudit({
    action: AUDIT_ACTIONS.CONTENT_DELETED,
    entityType: parsed.data.table,
    entityId: parsed.data.id,
  });
  revalidatePath("/admin/review");
  return { ok: true };
}

/* ===========================================================================
 * CRUD — fontes de ingestão (superadmin: canManagePipeline)
 * =========================================================================== */

export async function createSource(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canManagePipeline())) return { error: "Não autorizado." };
  const parsed = sourceSchema.safeParse({
    name: fd.get("name"),
    type: fd.get("type"),
    configJson: fd.get("configJson") ?? "{}",
    isActive: fd.get("isActive") === "on",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };

  let config: Json;
  try {
    config = JSON.parse(parsed.data.configJson || "{}");
    if (typeof config !== "object" || Array.isArray(config)) throw new Error();
  } catch {
    return { error: "config precisa ser um objeto JSON válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingestion_sources").insert({
    name: parsed.data.name,
    type: parsed.data.type,
    config,
    is_active: parsed.data.isActive,
  });
  if (error) return { error: "Falha ao criar fonte." };
  revalidatePath("/admin/sources");
  return { ok: true, message: "Fonte criada." };
}

export async function toggleSourceActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!(await canManagePipeline())) return forbidden();
  if (!z.string().uuid().safeParse(id).success)
    return { ok: false, error: "ID inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ingestion_sources")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: "Falha." };
  revalidatePath("/admin/sources");
  return { ok: true };
}

/** Liga/desliga um card do dashboard (feature-flag). Só staff (RLS reforça). */
export async function toggleDashboardCard(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  if (!(await canManagePipeline())) return forbidden();
  if (!DASHBOARD_CARD_KEYS.includes(key as never)) {
    return { ok: false, error: "Card inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("dashboard_cards")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) return { ok: false, error: "Falha ao atualizar o card." };
  revalidatePath("/dashboard");
  revalidatePath("/admin/cards");
  return { ok: true };
}

/** Move um card p/ cima/baixo trocando sort_order com o vizinho. Só staff. */
export async function moveDashboardCard(
  key: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  if (!(await canManagePipeline())) return forbidden();
  if (!DASHBOARD_CARD_KEYS.includes(key as never)) {
    return { ok: false, error: "Card inválido." };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_cards")
    .select("key, sort_order")
    .order("sort_order");
  const rows = (data as { key: string; sort_order: number }[] | null) ?? [];
  const idx = rows.findIndex((r) => r.key === key);
  if (idx === -1) return { ok: false, error: "Card não encontrado." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { ok: true }; // borda: no-op
  const a = rows[idx]!;
  const b = rows[swapIdx]!;
  // Troca os sort_order (sem unique constraint, não há colisão). RLS exige staff.
  const r1 = await supabase
    .from("dashboard_cards")
    .update({ sort_order: b.sort_order, updated_at: new Date().toISOString() })
    .eq("key", a.key);
  const r2 = await supabase
    .from("dashboard_cards")
    .update({ sort_order: a.sort_order, updated_at: new Date().toISOString() })
    .eq("key", b.key);
  if (r1.error || r2.error) return { ok: false, error: "Falha ao reordenar." };
  revalidatePath("/dashboard");
  revalidatePath("/admin/cards");
  return { ok: true };
}

/* ===========================================================================
 * CRUD — taxonomia / prompts (editor)
 * =========================================================================== */

export async function createPlatform(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = platformSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    isActive: fd.get("isActive") !== "off",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("platforms").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    is_active: parsed.data.isActive,
  });
  if (error) return { error: "Falha ao criar plataforma (slug duplicado?)." };
  revalidatePath("/admin/sources");
  return { ok: true, message: "Plataforma criada." };
}

export async function createNiche(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = nicheSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("niches").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { error: "Falha ao criar nicho (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Nicho criado." };
}

export async function createTag(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = tagSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_tags")
    .insert({ name: parsed.data.name, slug: parsed.data.slug });
  if (error) return { error: "Falha ao criar tag (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Tag criada." };
}

export async function createCategory(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = categorySchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });
  if (error) return { error: "Falha ao criar categoria (slug duplicado?)." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Categoria criada." };
}

export async function createTemplate(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await canReviewContent())) return { error: "Não autorizado." };
  const parsed = templateSchema.safeParse({
    categoryId: fd.get("categoryId"),
    title: fd.get("title"),
    objective: fd.get("objective"),
    whenToUse: fd.get("whenToUse"),
    requiredInput: fd.get("requiredInput") ?? "",
    promptBody: fd.get("promptBody"),
    exampleOutput: fd.get("exampleOutput"),
    tags: fd.get("tags") ?? "",
  });
  if (!parsed.success)
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_templates").insert({
    category_id: parsed.data.categoryId,
    title: parsed.data.title,
    objective: parsed.data.objective,
    when_to_use: parsed.data.whenToUse,
    required_input: csv(parsed.data.requiredInput),
    prompt_body: parsed.data.promptBody,
    example_output: parsed.data.exampleOutput,
    tags: csv(parsed.data.tags),
  });
  if (error) return { error: "Falha ao criar prompt." };
  revalidatePath("/admin/prompts");
  return { ok: true, message: "Prompt criado." };
}
