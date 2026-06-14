-- ============================================================================
-- bootstrap.local.sql — LOCAL ONLY
-- ----------------------------------------------------------------------------
-- Emula o ambiente do Supabase em um Postgres comum, para que os testes de RLS
-- rodem de verdade: cria os roles (anon, authenticated, service_role) e o
-- schema `auth` com auth.uid()/auth.role()/auth.jwt() lendo o claim do JWT.
--
-- NÃO rode isto no Supabase real — lá esses objetos já existem nativamente.
-- O service_role recebe BYPASSRLS, exatamente como no Supabase: é por isso que
-- ele só pode rodar em código isolado (SECURITY_GUIDE §3).
-- ============================================================================

do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

-- O superuser de conexão pode assumir qualquer um desses papéis (SET ROLE).
grant anon, authenticated, service_role to current_user;

create schema if not exists auth;

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

create or replace function auth.role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anon');
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
$$;
