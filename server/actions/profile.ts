"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/server/auth/session";
import { uploadAvatar } from "@/server/admin/storage";
import { consume } from "@/server/rate-limit";
import { RATE_LIMIT_GENERIC } from "@/lib/messages";
import type { ActionResult } from "@/server/actions/types";

export type AvatarResult = ActionResult<{ url: string }>;

/**
 * Atualiza o avatar do usuário. O upload (Storage) usa service-role isolado; a
 * gravação do `avatar_url` passa pelo cliente de usuário (RLS: a policy
 * profiles_self_update concede só colunas não-privilegiadas, incluindo avatar_url).
 * O user_id vem do contexto (anti-IDOR).
 */
export async function updateAvatarAction(
  formData: FormData,
): Promise<AvatarResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };
  if (!(await consume("avatar_upload", user.id)).success) {
    return { ok: false, error: RATE_LIMIT_GENERIC };
  }

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

/**
 * Sincroniza o tema escolhido pro perfil (UX-10) — sobrevive troca de
 * dispositivo/limpar localStorage, que continua sendo a fonte RÁPIDA (anti-
 * flash no root layout lê de lá, não daqui). Fire-and-forget: sem sessão,
 * no-op silencioso (chamado também nas páginas públicas via ThemeToggle);
 * falha de rede não deve virar toast de erro pra uma troca de tema.
 */
export async function saveThemePreferenceAction(
  theme: "light" | "dark",
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("user_id", user.id)
      .maybeSingle();
    const current = (data?.preferences as Record<string, unknown>) ?? {};
    await supabase
      .from("profiles")
      .update({ preferences: { ...current, theme } })
      .eq("user_id", user.id);
  } catch (err) {
    console.error("[profile] saveThemePreferenceAction:", err);
  }
}
