"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentOrgId } from "@/server/auth/session";
import {
  favoriteSchema,
  favoriteCollectionSchema,
} from "@/lib/validations/content";
import { recordAudit } from "@/server/audit/log";
import { AUDIT_ACTIONS } from "@/lib/constants";

export type ToggleResult =
  { ok: true; favorited: boolean } | { ok: false; error: string };

export type SetCollectionResult = { ok: true } | { ok: false; error: string };

/**
 * Liga/desliga um favorito. O user_id vem SEMPRE do contexto autenticado
 * (anti-IDOR, SECURITY_GUIDE §4) — nunca do input. A RLS é a rede de segurança.
 */
export async function toggleFavorite(input: unknown): Promise<ToggleResult> {
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { entityType, entityId } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Falha ao remover favorito." };
    await recordAudit({
      action: AUDIT_ACTIONS.FAVORITE_REMOVED,
      entityType,
      entityId,
    });
    revalidatePath("/favorites");
    return { ok: true, favorited: false };
  }

  const orgId = await getCurrentOrgId();
  const { error } = await supabase.from("user_favorites").insert({
    user_id: user.id, // derivado do contexto, não do input
    organization_id: orgId,
    entity_type: entityType,
    entity_id: entityId,
  });
  if (error) return { ok: false, error: "Falha ao favoritar." };
  await recordAudit({
    action: AUDIT_ACTIONS.FAVORITE_ADDED,
    entityType,
    entityId,
  });
  revalidatePath("/favorites");
  return { ok: true, favorited: true };
}

/**
 * Move um favorito do usuário para uma coleção (collection_name). O user_id vem
 * SEMPRE do contexto autenticado (anti-IDOR); a RLS (user_id = auth.uid()) é a
 * rede de segurança. Coleção vazia => null (volta para "Geral").
 */
export async function setFavoriteCollection(
  input: unknown,
): Promise<SetCollectionResult> {
  const parsed = favoriteCollectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { entityType, entityId, collection } = parsed.data;
  const collectionName = collection.length > 0 ? collection : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_favorites")
    .update({ collection_name: collectionName })
    .eq("user_id", user.id) // derivado do contexto, não do input
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) return { ok: false, error: "Falha ao mover de coleção." };

  await recordAudit({
    action: AUDIT_ACTIONS.FAVORITE_ADDED,
    entityType,
    entityId,
    metadata: { collection: collectionName },
  });
  revalidatePath("/favorites");
  return { ok: true };
}
