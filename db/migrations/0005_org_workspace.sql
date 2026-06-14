-- ============================================================================
-- 0005_org_workspace.sql — Workspace de agência (MVP 3)
-- Ativa a organização na UX: membros passam a enxergar co-membros da própria
-- org, e owner/admin podem gerenciar (inserir/atualizar/remover) membros.
-- Reverte de propósito o "multi-tenant latente" do MVP 1 (sancionado no MVP 3).
--
-- Recursão evitada: as policies usam helpers SECURITY DEFINER que consultam
-- organization_members BYPASSando a RLS — sem auto-referência de policy.
-- ============================================================================

create or replace function public.is_org_member(uid uuid, org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where user_id = uid and organization_id = org
  );
$$;

create or replace function public.org_role(uid uuid, org uuid)
returns text language sql stable security definer set search_path = public as $$
  select role::text from organization_members
  where user_id = uid and organization_id = org
  limit 1;
$$;

-- Substitui a policy restrita do MVP 1 (só a própria membership).
drop policy if exists "members_self_select" on organization_members;

create policy "members_select" on organization_members for select
  using (public.is_org_member(auth.uid(), organization_id));

create policy "members_insert" on organization_members for insert
  with check (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'));

create policy "members_update" on organization_members for update
  using (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'))
  with check (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'));

create policy "members_delete" on organization_members for delete
  using (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'));

-- Org: owner/admin podem atualizar dados da própria organização.
drop policy if exists "orgs_owner_update" on organizations;
create policy "orgs_manage_update" on organizations for update
  using (public.org_role(auth.uid(), id) in ('owner', 'admin'))
  with check (public.org_role(auth.uid(), id) in ('owner', 'admin'));
