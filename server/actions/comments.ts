"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/server/auth/session";
import {
  commentInputSchema,
  deleteCommentSchema,
} from "@/lib/validations/comments";
import { zodErrorMessage } from "@/server/actions/zod-error";
import { notifyCommentParticipants } from "@/server/admin/notify";
import { consume } from "@/server/rate-limit";
import type { ActionResult } from "@/server/actions/types";

export type CommentResult = ActionResult;

/**
 * Adiciona um comentário a uma edição. O user_id vem SEMPRE do contexto
 * autenticado (anti-IDOR, SECURITY_GUIDE §4) — nunca do input. A RLS é a rede de
 * segurança: o INSERT só passa com assinatura ativa e edição legível.
 */
export async function addComment(input: unknown): Promise<CommentResult> {
  const parsed = commentInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: zodErrorMessage(parsed.error) };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  if (!(await consume("comment", user.id)).success) {
    return {
      ok: false,
      error: "Muitos comentários em pouco tempo. Aguarde um instante.",
    };
  }

  const { editionId, body } = parsed.data;
  // Nome denormalizado no comentário (a RLS de profiles é própria-apenas, então
  // os outros leitores não conseguiriam resolver o nome via join).
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("edition_comments").insert({
    edition_id: editionId,
    user_id: user.id, // derivado do contexto, não do input
    body,
    author_name: profile?.name ?? null,
  });
  if (error) return { ok: false, error: "Falha ao publicar comentário." };

  // Notifica participantes da thread (best-effort, job de sistema isolado).
  await notifyCommentParticipants(editionId, user.id);

  revalidatePath(`/daily-briefing/${editionId}`);
  return { ok: true };
}

/**
 * Exclui um comentário pelo id. A RLS garante que só o autor ou staff consegue
 * excluir — não há checagem de autoria aqui além da defesa em profundidade.
 */
export async function deleteComment(input: unknown): Promise<CommentResult> {
  const parsed = deleteCommentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: zodErrorMessage(parsed.error) };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { id } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("edition_comments")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: "Falha ao excluir comentário." };

  revalidatePath("/daily-briefing", "layout");
  return { ok: true };
}
