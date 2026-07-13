# ADR-0003: Cache de `getEditionWithModules` é opt-in, não o padrão

## Status

Accepted

## Contexto

`getEditionWithModules` (`server/services/content.ts`) é chamada em dois
contextos com necessidades opostas: um leitor assinante vendo uma edição já
**publicada** (`daily-briefing/[id]`, `dashboard`) — conteúdo estável, seguro
cachear por alguns minutos — e um staff revisando um **rascunho** em
`/admin/review/[id]`, onde o `ItemEditor` edita campo a campo e dá
`router.refresh()` esperando ver a própria mudança na hora. Cachear por padrão
faria o revisor ver dado velho logo depois de editar. Pior: como o cache do
Next (`unstable_cache`) é compartilhado entre usuários, uma edição não-publicada
servida do caminho cacheado por engano vazaria para qualquer assinante que
batesse no mesmo ID — a RLS de staff (`editions_staff_all`) permite ao staff ler
o rascunho, mas isso não deveria nunca ir parar num cache que outros usuários
também leem.

## Decisão

O cache é opt-in via `{ cached: true }`, com default `false`. O caminho seguro
(sem cache) é o padrão; só quem sabe que está lendo conteúdo publicado
(dashboard/daily-briefing) pede cache explicitamente. `/admin/review` não muda:
continua chamando sem o segundo argumento. Como trava extra, o caminho cacheado
força um check de `isPubliclyReadable()` antes de devolver ou cachear qualquer
coisa — se por algum motivo uma edição não-publicada chegasse ali (ex.: chamada
teria vindo de contexto staff), ela não entra no cache compartilhado.

## Consequências

A extensão de cache (PERF-2) não introduziu risco de um revisor ver dado velho
nem de um assinante comum ver rascunho de outro — o padrão inseguro exigiria
opt-out, o padrão real exige opt-in. O custo é que todo novo call site precisa
decidir conscientemente se está lendo conteúdo publicado (pode cachear) ou não
(não pode) — não existe um modo "cacheie e não se preocupe". A tag de
invalidação (`edition-content`) também é global, não por edição: `updateItemField`/
`deleteItem` em `server/actions/admin/review.ts` só recebem `table`+`id` do item,
não o `editionId` do pai, e buscar isso custaria uma query extra por mutação —
dado o volume baixo dessas escritas, invalidar tudo é mais simples que invalidar
preciso.
