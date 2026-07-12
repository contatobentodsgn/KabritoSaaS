"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canManagePipeline } from "@/server/permissions";
import { DASHBOARD_CARD_KEYS } from "@/lib/dashboard-cards";
import { type ActionResult, forbidden } from "./shared";

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
  // getEnabledCardKeys() é cacheado (PERF-2, unstable_cache 5min) — invalida
  // na hora em vez de esperar o TTL, pra o toggle refletir de imediato.
  revalidateTag("dashboard-cards");
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
  // Mesma razão do toggle acima: invalida o cache de getEnabledCardKeys().
  revalidateTag("dashboard-cards");
  return { ok: true };
}
