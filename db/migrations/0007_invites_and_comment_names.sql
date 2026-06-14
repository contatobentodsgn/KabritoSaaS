-- ============================================================================
-- 0007_invites_and_comment_names.sql
-- (a) Convite por e-mail real: tabela org_invites (pendências de convite).
-- (b) Nomes na comunidade: author_name denormalizado em edition_comments
--     (evita expor profiles de terceiros — a RLS de profiles é própria-apenas).
-- ============================================================================

-- (a) Convites pendentes ------------------------------------------------------
create table if not exists "org_invites" (
  "id" uuid primary key default gen_random_uuid() not null,
  "organization_id" uuid not null references "organizations"("id") on delete cascade,
  "email" varchar(200) not null,
  "role" "member_role" not null default 'member',
  "token" varchar(64) not null unique,
  "invited_by" uuid,
  "created_at" timestamptz not null default now(),
  "accepted_at" timestamptz
);
create index if not exists "idx_invites_email" on "org_invites" (lower("email"));
create index if not exists "idx_invites_org" on "org_invites" ("organization_id");

grant select, insert, update, delete on "org_invites" to authenticated, service_role;
alter table org_invites enable row level security;

-- Só owner/admin da org enxergam e gerenciam convites. O ACEITE roda via
-- service_role isolado (server/admin), então não precisa de policy de usuário.
create policy "invites_manage" on org_invites for all
  using (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'))
  with check (public.org_role(auth.uid(), organization_id) in ('owner', 'admin'));

-- (b) Nome do autor no comentário --------------------------------------------
alter table "edition_comments" add column if not exists "author_name" varchar(120);
