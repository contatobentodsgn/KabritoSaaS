-- Idempotência + anti-replay do webhook do Stripe: registra os event.id já
-- processados. handleStripeEvent insere o id antes de processar; se já existir
-- (entrega duplicada / replay), pula. Escrita só pelo webhook (service_role,
-- bypassa RLS); RLS habilitada sem policies → nega qualquer acesso via JWT.

create table if not exists stripe_events (
  event_id text primary key,
  type varchar(120),
  created_at timestamptz not null default now()
);

alter table stripe_events enable row level security;
