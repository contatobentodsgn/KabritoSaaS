-- ============================================================================
-- 0018_profile_preferences.sql
-- ----------------------------------------------------------------------------
-- UX-10/UX-3: um único jsonb pra "estado de UI por usuário" — tema (hoje só em
-- localStorage, não sobrevive troca de dispositivo) e progresso do checklist de
-- onboarding (hoje binário em localStorage). Um campo só em vez de duas
-- migrations separadas pro mesmo conceito.
-- ============================================================================

alter table profiles
  add column preferences jsonb not null default '{}'::jsonb;

-- Mesmo anti-padrão da 0004/0009: grant por COLUNA, não a tabela toda. O UPDATE
-- geral de `authenticated` em profiles já é restrito a colunas específicas
-- (0009) — preferences precisa entrar explicitamente nessa lista, senão RLS
-- passa mas o grant barra ("permission denied for column preferences").
grant update (preferences) on profiles to authenticated;
