-- ============================================================================
-- 0008_public_profiles.sql — perfis públicos da comunidade
-- ----------------------------------------------------------------------------
-- View dedicada que expõe APENAS os campos públicos (user_id, name, avatar_url)
-- de perfis não-excluídos. `security_invoker = false` (definer) faz a view
-- contornar a RLS própria-apenas de `profiles` SEM expor e-mail/staff_role —
-- é a "policy dedicada" pedida: nome/avatar públicos, resto continua privado.
-- ============================================================================

create or replace view "public_profiles"
  with (security_invoker = false) as
  select user_id, name, avatar_url
  from profiles
  where deleted_at is null;

grant select on "public_profiles" to authenticated, anon, service_role;
