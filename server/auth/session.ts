import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_ROUTE } from "@/lib/constants";
import type { Organization, Profile } from "@/types";

/**
 * Helpers de sessão/identidade. Todos usam o CLIENTE SUPABASE (JWT) → RLS
 * aplicada. NUNCA usam o service-client. (PROJECT_MASTER_DOCUMENT §9)
 *
 * getCurrentUser/getCurrentProfile são memoizados por request com React cache():
 * várias chamadas no mesmo render (layout + requireAuth + isStaff + página)
 * colapsam em UMA ida ao Supabase — corta latência (banco em us-west).
 */

/** Usuário autenticado atual (ou null). Fonte da verdade: o JWT verificado. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Exige autenticação; redireciona para /login se anônimo. */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);
  return user;
}

/** Perfil do usuário atual (RLS: só o próprio). Memoizado por request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  // PostgREST devolve snake_case → normaliza para o tipo camelCase do domínio.
  const r = data as Record<string, unknown>;
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatar_url,
    staffRole: r.staff_role ?? null,
    deletedAt: r.deleted_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  } as Profile;
});

/**
 * Organização atual do usuário (container oculto do MVP). Derivada SEMPRE do
 * contexto autenticado — nunca de input do frontend (anti-IDOR, SECURITY_GUIDE §4).
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, organizations:organization_id(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgRaw = (data as { organizations?: Record<string, unknown> } | null)?.organizations;
  if (!orgRaw) return null;
  return {
    id: orgRaw.id,
    name: orgRaw.name,
    slug: orgRaw.slug,
    ownerId: orgRaw.owner_id,
    createdAt: orgRaw.created_at,
    updatedAt: orgRaw.updated_at,
  } as Organization;
}

/** Conveniência: id da org atual (derivado do contexto). */
export async function getCurrentOrgId(): Promise<string | null> {
  return (await getCurrentOrganization())?.id ?? null;
}

/**
 * Papel do usuário atual na própria organização (owner|admin|member|null).
 * Via cliente Supabase (RLS: o usuário vê a própria membership). Base de
 * autorização do workspace de agência (MVP 3).
 */
export async function getCurrentOrgRole(): Promise<
  "owner" | "admin" | "member" | null
> {
  const user = await getCurrentUser();
  if (!user) return null;
  const org = await getCurrentOrganization();
  if (!org) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .maybeSingle();
  return ((data as { role?: "owner" | "admin" | "member" } | null)?.role) ?? null;
}
