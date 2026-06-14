-- ============================================================================
-- 0009_profiles_deleted_at_lockdown.sql
-- ----------------------------------------------------------------------------
-- Endurece a exclusão de conta (LGPD) fechando um resíduo da auditoria
-- adversarial: a 0004 concedia a `authenticated` UPDATE sobre `deleted_at`. Isso
-- permitiria, em tese, que um usuário soft-deletado com sessão ANTES do gate de
-- login ZERASSE o próprio `deleted_at` via PostgREST — auto-ressurreição.
--
-- Mesmo anti-padrão da 0004 (que tirou `staff_role` do grant): privilégio por
-- COLUNA. O usuário deixa de poder escrever `deleted_at`; a exclusão passa a
-- gravar `deleted_at` exclusivamente pelo service_role (server/admin), que
-- mantém acesso total (BYPASSRLS + grants próprios, não afetados aqui).
-- ============================================================================

revoke update on profiles from authenticated;

-- authenticated só altera estas colunas das PRÓPRIAS linhas (RLS garante a posse).
-- `deleted_at` e `staff_role` ficam FORA → nem auto-promoção nem auto-ressurreição.
grant update (name, email, avatar_url, updated_at) on profiles to authenticated;
