-- ============================================================================
-- 0019_hot_column_indexes.sql
-- ----------------------------------------------------------------------------
-- PERF-7: índices em colunas "quentes" (edition_date/organization_id/user_id)
-- que são realmente filtradas/ordenadas no código mas ainda não tinham índice
-- próprio — levantamento cruzando db/schema.ts + migrations 0000-0018 (o que
-- já existe) com o uso real em server/services|actions|admin (o que é de fato
-- consultado). Não é "toda coluna com esse nome": profiles.user_id e
-- user_favorites.user_id já têm UNIQUE/índice; organization_members
-- .organization_id e org_invites.organization_id já são o prefixo esquerdo de
-- um índice/UNIQUE existente (indexar de novo seria redundante);
-- generation_runs.edition_date e access_logs/audit_logs
-- (.organization_id/.user_id) não aparecem em nenhum WHERE/ORDER BY/JOIN real
-- — ficaram de fora. Justificativa por índice, com call site, na descrição do PR.
--
-- NÃO-CONCORRENTE DE PROPÓSITO: db/migrate.ts roda cada migration dentro de
-- uma transação (sql.begin), e o Postgres não permite CREATE INDEX
-- CONCURRENTLY dentro de transação. Um create index comum tranca ESCRITAS na
-- tabela brevemente enquanto constrói (leituras seguem liberadas) — aceitável
-- nos tamanhos atuais dessas tabelas. Se alguma crescer muito no futuro, criar
-- o índice concorrente como operação manual AVULSA, fora do runner
-- transacional deste projeto (CREATE INDEX CONCURRENTLY IF NOT EXISTS ...
-- rodado direto no banco, não via db:migrate).
-- ============================================================================

create index if not exists content_editions_edition_date_idx on content_editions (edition_date);
create index if not exists organization_members_user_id_idx on organization_members (user_id);
create index if not exists user_sessions_user_id_idx on user_sessions (user_id);
create index if not exists edition_comments_user_id_idx on edition_comments (user_id);
create index if not exists subscriptions_organization_id_idx on subscriptions (organization_id);
