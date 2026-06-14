-- ============================================================================
-- 0004_profiles_privilege_fix.sql
-- ----------------------------------------------------------------------------
-- Corrige ESCALADA DE PRIVILÉGIO encontrada na auditoria adversarial:
-- a RLS de profiles restringe a LINHA (user_id = auth.uid()) mas o GRANT
-- table-wide permitia ao usuário `authenticated` alterar QUALQUER coluna da
-- própria linha — inclusive `staff_role` — virando staff via PostgREST direto.
--
-- Defesa correta em Postgres: privilégio por COLUNA. O usuário só pode alterar
-- colunas não-privilegiadas das próprias linhas; `staff_role` fica FORA. O
-- service_role (provisionamento/admin) mantém acesso total (BYPASSRLS + grant).
-- (SECURITY_GUIDE §3 — a RLS é a rede de segurança real.)
-- ============================================================================

revoke insert, update on profiles from authenticated;
revoke insert, update on profiles from anon;

-- authenticated só altera estas colunas das PRÓPRIAS linhas (RLS garante a posse).
-- `staff_role` NÃO está na lista → tentativa de auto-promoção é negada.
grant update (name, email, avatar_url, deleted_at, updated_at) on profiles to authenticated;

-- INSERT de profile é exclusivo do service_role (provisionamento pós-cadastro).
drop policy if exists "profiles_self_insert" on profiles;
