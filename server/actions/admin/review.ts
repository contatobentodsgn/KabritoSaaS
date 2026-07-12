"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { requireAal2 } from "@/server/auth/mfa";
import { canReviewContent } from "@/server/permissions";
import { recordAudit } from "@/server/audit/log";
import { sendEditionDigest } from "@/server/admin/notify";
import { AUDIT_ACTIONS } from "@/lib/constants";
import {
  rejectionSchema,
  editionEditSchema,
  itemEditSchema,
  itemDeleteSchema,
  EDITABLE_ITEM_TABLES,
} from "@/lib/validations/admin";
import { zodErrorMessage } from "@/server/actions/zod-error";
import { type ActionResult, forbidden } from "./shared";

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
  // getLatestEdition() é cacheado (PERF-2, unstable_cache 5min, tag
  // "editions") — invalida na hora pra a edição recém-publicada virar a
  // "atual" imediatamente, em vez de esperar o TTL.
  revalidateTag("editions");
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

/**
 * Desfaz uma rejeição recente (UX-5) — volta a edição para 'pending', como se
 * a rejeição não tivesse acontecido. Gated em `review_status = 'rejected'`
 * (concorrência otimista, mesmo padrão do `approveEdition` legado): se o
 * estado já mudou por outra via, o "Desfazer" falha em vez de sobrescrever.
 */
export async function undoRejectEdition(
  editionId: string,
): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  if (!z.string().uuid().safeParse(editionId).success)
    return { ok: false, error: "ID inválido." };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("content_editions")
    .update({ review_status: "pending", reviewed_by: null, reviewed_at: null })
    .eq("id", editionId)
    .eq("review_status", "rejected")
    .select("id");
  if (error) return { ok: false, error: "Falha ao desfazer." };
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Não foi mais possível desfazer — a edição já mudou de estado.",
    };
  }

  await recordAudit({
    action: AUDIT_ACTIONS.CONTENT_REJECTION_UNDONE,
    entityType: "content_edition",
    entityId: editionId,
  });
  revalidatePath("/admin/review");
  return { ok: true };
}

export async function updateEditionMeta(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = editionEditSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: zodErrorMessage(parsed.error) };
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
  // getEditionWithModules(id, { cached: true }) é cacheado (PERF-2) — cobre
  // o caso raro de correção pós-publicação (edição já publicada sendo
  // editada aqui) refletir pro assinante sem esperar o TTL.
  revalidateTag("edition-content");
  return { ok: true };
}

export async function updateItemField(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = itemEditSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: zodErrorMessage(parsed.error) };
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
  // Mesma razão do updateEditionMeta acima: invalida o cache de
  // getEditionWithModules(id, { cached: true }) (PERF-2).
  revalidateTag("edition-content");
  return { ok: true };
}

export async function deleteItem(input: unknown): Promise<ActionResult> {
  if (!(await canReviewContent())) return forbidden();
  const parsed = itemDeleteSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: zodErrorMessage(parsed.error) };
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
  // Mesma razão do updateEditionMeta acima: invalida o cache de
  // getEditionWithModules(id, { cached: true }) (PERF-2).
  revalidateTag("edition-content");
  return { ok: true };
}
