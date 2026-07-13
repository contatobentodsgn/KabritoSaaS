# ADR-0001: RLS como camada primária de controle de acesso, com service-role isolado por diretório

## Status

Accepted

## Contexto

O sistema tem dois jeitos de falar com o Postgres: o cliente Supabase autenticado
via JWT do usuário (RLS sempre avaliada) e dois caminhos de service-role que
ignoram RLS por completo — `server/db/service-client.ts` (Drizzle, conecta como
dono das tabelas via `DATABASE_URL`) e `server/admin/supabase-admin.ts`
(`SUPABASE_SERVICE_ROLE_KEY`, via PostgREST). O pipeline de geração de conteúdo e
as operações administrativas (cron, provisionamento, billing) genuinamente
precisam de acesso cross-user/cross-org que a RLS não permitiria. Sem uma barreira
estrutural, nada impede que um `import` de conveniência traga o service-client
para dentro de uma Server Action de usuário final — bastaria um erro de revisão
para uma rota comum ignorar RLS silenciosamente.

## Decisão

RLS no Postgres é a camada de autorização por padrão para todo acesso a dados
de usuário final; os dois caminhos de service-role só podem ser importados de
`server/pipeline/`, `server/admin/` e `app/api/cron/`. Isso não é uma convenção
de code review — é imposto por uma regra local do ESLint (`boundaries` em
`eslint.config.mjs`), que barra o import fora dessas pastas antes do build.
`server/admin/**`, que por natureza opera cross-user/cross-org, revalida o papel
do ator internamente (`actorRole()` em `server/admin/team.ts`) como
defesa-em-profundidade — nunca confia só no gate da Server Action que o chamou.

## Consequências

RLS vira a fonte de verdade de autorização, testada de verdade contra Postgres
(`tests/rls/rls.test.ts`, não mockado) em vez de reimplementada em application
code espalhado. O custo é disciplina extra ao criar tabela nova: a policy sozinha
não basta — falta o `GRANT` explícito para `service_role` (RLS só é avaliada
depois do grant; sem grant é "permission denied", não um bypass silencioso), e
esquecer isso quebra o caminho admin em vez de abrir um buraco de segurança — o
erro é visível, não silencioso. Column-level bypass real permanece só nos três
diretórios isolados, o que também facilita auditoria: para saber onde RLS pode
ser ignorada, basta grep nesses três caminhos.
