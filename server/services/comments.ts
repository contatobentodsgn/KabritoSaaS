import { createClient } from "@/lib/supabase/server";

/** Comentário de uma edição (enriquecido com o perfil público do autor). */
export interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string;
}

/**
 * Comentários de uma edição, do mais antigo ao mais recente.
 *
 * Via cliente Supabase (RLS aplicada): só retornam comentários de edições
 * legíveis pelo usuário (staff OU edição publicada/não-expirada + assinatura).
 * Sem join em profiles — a RLS de profiles é própria-apenas; o autor é resolvido
 * na UI ("Você"/"Membro").
 */
export async function listComments(editionId: string): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("edition_comments")
    .select("id, user_id, body, author_name, created_at")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: true });
  const rows = (data as Omit<CommentRow, "author_avatar">[]) ?? [];
  if (rows.length === 0) return [];

  // Nome/avatar PÚBLICOS atuais via a view dedicada (não vaza e-mail/role).
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase
    .from("public_profiles")
    .select("user_id, name, avatar_url")
    .in("user_id", ids);
  const byUser = new Map(
    ((profs as { user_id: string; name: string | null; avatar_url: string | null }[]) ?? []).map(
      (p) => [p.user_id, p],
    ),
  );

  return rows.map((r) => {
    const p = byUser.get(r.user_id);
    return {
      ...r,
      author_name: p?.name ?? r.author_name ?? null, // nome atual; fallback denormalizado
      author_avatar: p?.avatar_url ?? null,
    };
  });
}
