import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getCurrentProfile,
  getCurrentOrganization,
} from "@/server/auth/session";
import { DEFAULT_REDIRECT } from "@/lib/constants";
import type { ContentEdition, Subscription, StaffRole } from "@/types";

/**
 * Camada de PERMISSÕES (autorização no servidor — nunca no frontend).
 * Helpers do PROJECT_MASTER_DOCUMENT §9. Defesa em profundidade: mesmo que um
 * helper falhe, a RLS bloqueia (desde que a query passe pelo cliente de usuário).
 */

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** Assinatura da org do usuário (via cliente de usuário → RLS). */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  const org = await getCurrentOrganization();
  if (!org) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  // PostgREST devolve snake_case → normaliza para o tipo camelCase do domínio.
  const r = data as Record<string, unknown>;
  return {
    id: r.id,
    organizationId: r.organization_id,
    planId: r.plan_id,
    customerId: r.customer_id,
    subscriptionStatus: r.subscription_status,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  } as Subscription;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return false;
  if (!ACTIVE_STATUSES.has(sub.subscriptionStatus)) return false;
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    return false;
  }
  return true;
}

/** Exige assinatura ativa; senão manda para /settings (status + ativação). */
export async function requireActiveSubscription(): Promise<void> {
  if (!(await hasActiveSubscription())) redirect("/settings?inactive=1");
}

/** Defesa em profundidade na leitura de edição (além da RLS). */
export function canReadEdition(edition: Pick<ContentEdition, "status" | "contentExpiresAt">): boolean {
  if (edition.status !== "published") return false;
  if (edition.contentExpiresAt && new Date(edition.contentExpiresAt) < new Date()) {
    return false;
  }
  return true;
}

/* --------------------------------------------------------------------------
 * Staff (equipe interna) — editor / superadmin
 * ------------------------------------------------------------------------ */
export async function getStaffRole(): Promise<StaffRole | null> {
  const profile = await getCurrentProfile();
  return (profile?.staffRole as StaffRole | null) ?? null;
}

export async function isStaff(): Promise<boolean> {
  return (await getStaffRole()) !== null;
}

export async function canReviewContent(): Promise<boolean> {
  const role = await getStaffRole();
  return role === "editor" || role === "superadmin";
}

export async function canManagePipeline(): Promise<boolean> {
  return (await getStaffRole()) === "superadmin";
}

/** Exige staff (qualquer papel interno) para acessar /admin. */
export async function requireStaff(): Promise<StaffRole> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const role = await getStaffRole();
  if (!role) redirect(DEFAULT_REDIRECT);
  return role;
}

/** Exige papel que pode revisar (editor/superadmin). */
export async function requireEditor(): Promise<StaffRole> {
  const role = await requireStaff();
  if (role !== "editor" && role !== "superadmin") redirect(DEFAULT_REDIRECT);
  return role;
}

/** Exige superadmin (config de pipeline/custos/usuários internos). */
export async function requireSuperadmin(): Promise<void> {
  const role = await requireStaff();
  if (role !== "superadmin") redirect(DEFAULT_REDIRECT);
}
