-- ============================================================================
-- 0006_comments.sql — Comunidade (MVP 3): comentários por edição
-- Leitura: assinante ativo numa edição publicada/não-expirada, OU staff.
-- Escrita: o próprio usuário (user_id = auth.uid()) numa edição legível.
-- Remoção: o autor OU staff.
-- ============================================================================

create table if not exists "edition_comments" (
  "id" uuid primary key default gen_random_uuid() not null,
  "edition_id" uuid not null references "content_editions"("id") on delete cascade,
  "user_id" uuid not null,
  "body" text not null,
  "created_at" timestamptz not null default now()
);
create index if not exists "idx_comments_edition" on "edition_comments" ("edition_id");

grant select, insert, update, delete on "edition_comments" to authenticated, service_role;

alter table edition_comments enable row level security;

-- Leitura: edição publicada/não-expirada + assinatura ativa, ou staff.
create policy "comments_select" on edition_comments for select
  using (
    public.is_staff(auth.uid())
    or (
      public.is_edition_published(edition_id)
      and public.has_active_subscription(auth.uid())
    )
  );

-- Escrita: o próprio, numa edição que ele pode ler (assinatura ativa).
create policy "comments_insert" on edition_comments for insert
  with check (
    user_id = auth.uid()
    and public.is_edition_published(edition_id)
    and public.has_active_subscription(auth.uid())
  );

-- Remoção: autor ou staff (moderação).
create policy "comments_delete" on edition_comments for delete
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
