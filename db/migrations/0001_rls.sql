-- ============================================================================
-- 0001_rls.sql — RLS por domínio (SECURITY_GUIDE §6, TECHNICAL_SPEC §4)
-- ----------------------------------------------------------------------------
-- Portável para o Supabase real: assume que `auth.uid()` e os roles
-- (anon, authenticated, service_role) já existem (no local, são criados pelo
-- bootstrap tests/rls/bootstrap.local.sql ANTES desta migration).
--
-- Princípio: a RLS é a rede de segurança real. Vale para queries via cliente
-- Supabase (JWT). O service_role (BYPASSRLS) e o Drizzle direto IGNORAM a RLS
-- de propósito — por isso só rodam isolados em pipeline/cron/admin (§3).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER => rodam como dono, bypassam RLS internamente e
-- evitam recursão de policy). STABLE pois leem dados dentro da transação.
-- ---------------------------------------------------------------------------
create or replace function public.has_active_subscription(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from subscriptions s
    join organization_members m on m.organization_id = s.organization_id
    where m.user_id = uid
      and s.subscription_status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.user_id = uid and p.staff_role is not null and p.deleted_at is null
  );
$$;

create or replace function public.is_edition_published(eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from content_editions e
    where e.id = eid
      and e.status = 'published'
      and (e.content_expires_at is null or e.content_expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- Grants base (Supabase concede por padrão; explícito aqui é idempotente).
-- A RLS faz a restrição fina por linha; o grant só permite a tabela existir
-- para o role. service_role tem BYPASSRLS.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;
grant select on all tables in schema public to anon;

-- ===========================================================================
-- DOMÍNIO A — CONTEÚDO EDITORIAL (GLOBAL)
-- Leitura: published + não expirado + assinatura ativa. Escrita: só staff.
-- ===========================================================================

alter table content_editions enable row level security;
create policy "editions_select_published" on content_editions for select
  using (
    status = 'published'
    and (content_expires_at is null or content_expires_at > now())
    and public.has_active_subscription(auth.uid())
  );
create policy "editions_staff_all" on content_editions for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Tabelas-filhas: visíveis se a edição-pai está publicada/não-expirada + assinatura ativa.
do $$
declare t text;
begin
  foreach t in array array[
    'trend_items','explore_reports','copy_patterns',
    'visual_patterns','headlines','content_suggestions'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "%1$s_select" on %1$I for select
      using (public.is_edition_published(edition_id) and public.has_active_subscription(auth.uid()));
    $f$, t);
    execute format($f$
      create policy "%1$s_staff_all" on %1$I for all
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
    $f$, t);
  end loop;
end $$;

-- Taxonomia / evergreen: leitura p/ assinante ativo ou staff; escrita só staff.
do $$
declare t text;
begin
  foreach t in array array[
    'platforms','niches','content_tags','prompt_categories','prompt_templates'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "%1$s_select" on %1$I for select
      using (public.has_active_subscription(auth.uid()) or public.is_staff(auth.uid()));
    $f$, t);
    execute format($f$
      create policy "%1$s_staff_all" on %1$I for all
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
    $f$, t);
  end loop;
end $$;

-- ===========================================================================
-- DOMÍNIO B — INGESTÃO / PIPELINE (INTERNO) — sem acesso de usuário final
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['ingestion_sources','raw_signals','generation_runs'] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "%1$s_staff_only" on %1$I for all
      using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
    $f$, t);
  end loop;
end $$;

-- ===========================================================================
-- DOMÍNIO C — DADOS DE USUÁRIO (ESCOPADO)
-- ===========================================================================

-- profiles: só o próprio (staff pode ler todos para o admin)
alter table profiles enable row level security;
create policy "profiles_self_select" on profiles for select
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "profiles_self_insert" on profiles for insert
  with check (user_id = auth.uid());
create policy "profiles_self_update" on profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- organizations: membros leem; dono atualiza
alter table organizations enable row level security;
create policy "orgs_member_select" on organizations for select
  using (
    exists (
      select 1 from organization_members m
      where m.organization_id = organizations.id and m.user_id = auth.uid()
    )
  );
create policy "orgs_owner_update" on organizations for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- organization_members: o usuário vê a própria membership (MVP: org invisível)
alter table organization_members enable row level security;
create policy "members_self_select" on organization_members for select
  using (user_id = auth.uid());

-- user_favorites: só os próprios (CRUD completo)
alter table user_favorites enable row level security;
create policy "favorites_own_all" on user_favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_sessions: só as próprias
alter table user_sessions enable row level security;
create policy "sessions_own_all" on user_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- access_logs: o usuário lê/insere os próprios
alter table access_logs enable row level security;
create policy "access_logs_own_select" on access_logs for select
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "access_logs_own_insert" on access_logs for insert
  with check (user_id = auth.uid());

-- audit_logs: interno — só staff lê
alter table audit_logs enable row level security;
create policy "audit_logs_staff_select" on audit_logs for select
  using (public.is_staff(auth.uid()));

-- ===========================================================================
-- DOMÍNIO D — BILLING (PLANO ÚNICO)
-- ===========================================================================

-- plans: catálogo público (plano único) — leitura liberada
alter table plans enable row level security;
create policy "plans_public_select" on plans for select using (true);
create policy "plans_staff_all" on plans for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- subscriptions: o usuário vê só a assinatura da própria org
alter table subscriptions enable row level security;
create policy "subs_member_select" on subscriptions for select
  using (
    exists (
      select 1 from organization_members m
      where m.organization_id = subscriptions.organization_id
        and m.user_id = auth.uid()
    )
  );
