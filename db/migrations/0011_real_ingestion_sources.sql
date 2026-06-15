-- ============================================================================
-- 0011_real_ingestion_sources.sql
-- ----------------------------------------------------------------------------
-- Substitui as fontes de EXEMPLO (example.com → 404 a cada run) por fontes RSS
-- REAIS do Google News (busca por tópico, PT-BR): legal, sem scraping, sempre
-- fresco. O conector RSS existente extrai os títulos das matérias como sinais.
-- Idempotente: desativa as dummy e insere as reais só se ainda não existirem.
-- (Staff pode adicionar/editar/desativar outras fontes em /admin/sources.)
-- ============================================================================

-- 1) Desativa as fontes de exemplo (param a ingestão de dar 404). Mantém o
--    registro (histórico de raw_signals); o admin pode excluir depois.
update ingestion_sources set is_active = false
where config->>'url' like '%example.com%';

-- 2) Insere as fontes reais (Google News RSS). NOT EXISTS = idempotente por nome.
insert into ingestion_sources (name, type, config, is_active)
select 'Google News — Marketing de conteúdo', 'rss'::source_type,
  '{"url":"https://news.google.com/rss/search?q=marketing+de+conte%C3%BAdo&hl=pt-BR&gl=BR&ceid=BR:pt-419"}'::jsonb, true
where not exists (select 1 from ingestion_sources where name = 'Google News — Marketing de conteúdo');

insert into ingestion_sources (name, type, config, is_active)
select 'Google News — Redes sociais', 'rss'::source_type,
  '{"url":"https://news.google.com/rss/search?q=redes+sociais+marketing&hl=pt-BR&gl=BR&ceid=BR:pt-419"}'::jsonb, true
where not exists (select 1 from ingestion_sources where name = 'Google News — Redes sociais');

insert into ingestion_sources (name, type, config, is_active)
select 'Google News — Criadores de conteúdo', 'rss'::source_type,
  '{"url":"https://news.google.com/rss/search?q=criadores+de+conte%C3%BAdo&hl=pt-BR&gl=BR&ceid=BR:pt-419"}'::jsonb, true
where not exists (select 1 from ingestion_sources where name = 'Google News — Criadores de conteúdo');

insert into ingestion_sources (name, type, config, is_active)
select 'Google News — Tendências digitais', 'rss'::source_type,
  '{"url":"https://news.google.com/rss/search?q=tend%C3%AAncias+marketing+digital&hl=pt-BR&gl=BR&ceid=BR:pt-419"}'::jsonb, true
where not exists (select 1 from ingestion_sources where name = 'Google News — Tendências digitais');
