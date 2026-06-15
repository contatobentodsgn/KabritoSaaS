-- ============================================================================
-- 0010_dashboard_cards.sql
-- ----------------------------------------------------------------------------
-- Feature-flags dos cards do dashboard: liga/desliga por card no painel admin,
-- SEM mexer no código. O conteúdo do card (ícone/título/href) continua no código
-- (registry); aqui guardamos só visibilidade + ordem.
--
-- RLS: leitura por qualquer usuário autenticado (config de UI global, sem PII);
-- escrita só por staff (espelha o padrão *_staff_all). O service_role não é usado
-- aqui — o toggle é ação de staff via cliente JWT (RLS é a rede de segurança).
-- ============================================================================

create table if not exists dashboard_cards (
  key text primary key,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table dashboard_cards enable row level security;

drop policy if exists "dashboard_cards_select" on dashboard_cards;
create policy "dashboard_cards_select" on dashboard_cards
  for select using (auth.uid() is not null);

drop policy if exists "dashboard_cards_staff_write" on dashboard_cards;
create policy "dashboard_cards_staff_write" on dashboard_cards
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

grant select on dashboard_cards to authenticated;
grant update on dashboard_cards to authenticated;

-- Seed: 1 linha por card. "calendario" começa DESLIGADO (estava oculto no código).
insert into dashboard_cards (key, enabled, sort_order) values
  ('trends', true, 10),
  ('explore', true, 20),
  ('copy', true, 30),
  ('suggestions', true, 40),
  ('headlines', true, 50),
  ('visual', true, 60),
  ('prompts', true, 70),
  ('favorites', true, 80),
  ('adaptar', true, 90),
  ('calendario', false, 100)
on conflict (key) do nothing;
