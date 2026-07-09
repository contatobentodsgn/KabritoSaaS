-- Recovery codes de MFA (SEC-3): elimina a dependência do CLI admin
-- (npm run mfa:reset) para quem perde o autenticador. Gerados 1x na ativação
-- do 2FA, mostrados 1x ao usuário; só o HASH persiste (nunca o código em
-- claro). Cada código é de uso único (used_at marca quando foi consumido).
--
-- Acesso via cliente de USUÁRIO (RLS), não service-role: são dados do próprio
-- usuário, o padrão "own row" já usado em user_favorites/user_sessions/etc é
-- suficiente (um usuário só pode gerenciar os PRÓPRIOS códigos de recuperação
-- — não há caminho pra afetar a conta de outro usuário por aqui).

create table mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index mfa_recovery_codes_user_id_idx on mfa_recovery_codes (user_id);

alter table mfa_recovery_codes enable row level security;

create policy "mfa_recovery_own_select" on mfa_recovery_codes for select
  using (user_id = auth.uid());

create policy "mfa_recovery_own_insert" on mfa_recovery_codes for insert
  with check (user_id = auth.uid());

create policy "mfa_recovery_own_update" on mfa_recovery_codes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "mfa_recovery_own_delete" on mfa_recovery_codes for delete
  using (user_id = auth.uid());

-- A RLS restringe por LINHA; sem o GRANT de tabela, o role nem chega a essa
-- checagem ("permission denied for table"). O grant de 0001_rls.sql
-- ("on all tables in schema public") só valeu para as tabelas que já
-- existiam naquele momento — não é retroativo para tabelas novas.
--
-- Só `authenticated`: o service_role NÃO é usado aqui de propósito (mesmo
-- padrão de dashboard_cards, migration 0010) — toda geração/verificação passa
-- pelo cliente JWT do próprio usuário; a RLS acima é a rede de segurança real.
grant select, insert, update, delete on mfa_recovery_codes to authenticated;
