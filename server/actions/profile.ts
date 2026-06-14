"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { uploadAvatar } from "@/server/admin/storage";

export type AvatarResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Atualiza o avatar do usuário. O upload (Storage) usa service-role isolado; a
 * gravação do `avatar_url` passa pelo cliente de usuário (RLS: a policy
 * profiles_self_update concede só colunas não-privilegiadas, incluindo avatar_url).
 * O user_id vem do contexto (anti-IDOR).
 */
export async function updateAvatarAction(formData: FormData): Promise<AvatarResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }

  const up = await uploadAvatar(user.id, file);
  if (!up.ok) return up;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: up.url })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Falha ao salvar o avatar." };

  revalidatePath("/settings");
  revalidatePath("/daily-briefing", "layout");
  return { ok: true, url: up.url };
}
