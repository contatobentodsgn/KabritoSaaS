# ADR-0004: Migrations são arquivos SQL sequenciais escritos à mão, não geradas integralmente pelo Drizzle Kit

## Status

Accepted

## Contexto

`db/schema.ts` é descrito no próprio arquivo como um schema Drizzle "de
REFERÊNCIA" — descreve a estrutura das tabelas, mas não é a fonte de verdade
completa do banco. Duas categorias de objeto que o projeto depende pesadamente
(RLS policies, funções auxiliares como `has_active_subscription`/`is_staff`,
grants explícitos para `service_role`, RPCs como `approve_edition`) não têm
representação no dialeto de schema do Drizzle Kit — só existem como SQL puro. O
Drizzle Kit também não gerencia `auth.users` (schema `auth` do Supabase), então
colunas como `user_id` são `uuid` sem FK gerenciada. Depender só de
`drizzle-kit generate` deixaria RLS/functions/grants fora do controle de versão
do schema, ou exigiria um processo paralelo pra sincronizar as duas fontes.

## Decisão

`db/migrations/*.sql` é uma sequência numerada (`0000` → `0019`) de arquivos SQL
aplicados em ordem por `db/migrate.ts`, que usa a conexão direta
(`DATABASE_URL`) e uma tabela `_migrations` de tracking para idempotência entre
runs. Migrations de DDL pura de tabela podem nascer de `npm run db:generate`
(Drizzle Kit, a partir de `db/schema.ts`), mas RLS, policies, funções e RPCs são
escritas à mão no mesmo arquivo sequencial ou em arquivos seguintes — não existe
uma segunda trilha de migração "não-Drizzle" separada.

## Consequências

Uma única sequência de arquivos SQL numerados é a fonte de verdade real do
schema em produção — mais simples de auditar (`git log db/migrations/`) e mais
fácil de aplicar manualmente se necessário do que reconciliar duas fontes
(Drizzle Kit + SQL solto). O custo é que `db/schema.ts` pode ficar
temporariamente defasado do banco real se uma migration hand-written alterar
algo que o schema Drizzle também descreve (ex.: uma coluna) sem o autor lembrar
de atualizar os dois — não há checagem automática de que os dois convergem, só
disciplina de revisão.
