-- 0012: defesa em profundidade contra injeção stored em profiles.avatar_url.
--
-- A RLS concede UPDATE(avatar_url) ao próprio usuário, mas restringe apenas a
-- LINHA (user_id = auth.uid()), nunca o VALOR. Logo um PATCH direto via PostgREST
-- contorna a server action (que só grava URLs do Storage) e poderia salvar uma
-- URL arbitrária (ex.: https://attacker.com/x.gif), renderizada em <img src>
-- para outros usuários (vazamento de IP / tracking / spoofing).
--
-- Este CHECK limita avatar_url a NULL ou a uma URL pública do Supabase Storage.
-- NOT VALID: passa a valer para todo INSERT/UPDATE futuro (cobre o ataque) sem
-- revalidar linhas já existentes (evita falha da migração com dados legados).

alter table profiles drop constraint if exists profiles_avatar_url_supabase;

alter table profiles
  add constraint profiles_avatar_url_supabase
  check (
    avatar_url is null
    or avatar_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/'
  )
  not valid;
