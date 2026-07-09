# Checklist de produção (SECURITY_GUIDE §11) — estado real

Legenda: `[x]` cumprido e verificado · `[~]` implementado no código, exige config de
infra no deploy (Supabase/Vercel/Sentry) · `[ ]` pendente.

> Evidências apontam para arquivos/testes deste repositório. Rodar:
> `npm run typecheck && npm run lint && npm run test` (46 testes; 36 de RLS).

> **Auditoria adversarial (Fase 9, 2026-06-14):** os 22 itens foram verificados
> por um auditor por grupo + um cético tentando REFUTAR cada PASS. A refutação
> derrubou 4 itens que pareciam OK (P3 teto, E1/E2 sessão, L2 exclusão) —
> furos reais de código, todos corrigidos e re-verificados como fechados.
> Itens marcados **(auditado)** passaram por essa verificação dupla.

## Banco e RLS

- [x] RLS habilitada em **todas** as tabelas sensíveis **(auditado)** — 26/26 tabelas (incl. `edition_comments`, `org_invites`) com `enable row level security`; cruzado tabela a tabela contra `db/schema.ts` (`db/migrations/0001_rls.sql`, `0006`, `0007`).
- [x] Teste-âncora (6.1): cliente respeita RLS, `service_role` ignora **(auditado)** — `tests/rls/rls.test.ts` (A não vê favorito de B; service_role vê ambos).
- [x] Testes 6.2–6.4 (assinatura, isolamento, escrita restrita) **(auditado)** — passam; cobertura extra 6.5–6.10.
- [x] Nenhuma policy de leitura ampla por engano **(auditado)** — 30 policies revisadas; único `using(true)` é `plans` (catálogo público, plano único); demais exigem `auth.uid()`/assinatura/staff/membership.
- [x] **Sem escalada de privilégio por coluna** — usuário não seta o próprio `staff_role` (`0004`; regressão `tests/rls/rls.test.ts` §6.5).
- [x] **Sem auto-ressurreição de conta** — usuário não escreve o próprio `deleted_at` (`db/migrations/0009_profiles_deleted_at_lockdown.sql`, GRANT por coluna sem `deleted_at`; regressão §6.10). ⚠️ aplicar a `0009` na Supabase no deploy (`npm run db:migrate`); o app funciona sem ela (soft-delete via service role), a `0009` só fecha o resíduo latente.

## Conexões e segredos

- [x] `service_role`/Drizzle direto só em `server/pipeline`, `server/admin`, `app/api/cron` — `server/db/service-client.ts` (`import "server-only"`). Zonas isoladas adicionais aceitas: `db/**` (scripts de migração/seed) e `tests/**` (harness) — nunca código servido ao usuário.
- [x] Lint bloqueia import do cliente de serviço fora dessas pastas — `eslint.config.mjs` (override libera as mesmas pastas isoladas acima).
- [x] Nenhum segredo importado em `"use client"` **(auditado)** — 24 arquivos client varridos; só imports type-only/Server Actions. Defesa tripla: `server-only` + `eslint-rules/no-secrets-in-client.js` + `publicEnv`.
- [x] `.env` fora do versionamento; `.env.example` atualizado **(auditado)** — `.gitignore` (`.env*.local`); cobre todas as chaves de `server/env.ts`.

## Autorização

- [x] Caminho negativo (403/deny, não 500) — `canReviewContent`/`canManagePipeline` retornam `{ok:false}`; `requireStaff` redireciona; RLS 6.4 prova bloqueio no banco. _(Nota: a negação é testada na camada RLS; não há teste unitário invocando as server actions diretamente.)_
- [x] `organization_id`/`user_id` nunca vêm do frontend **(auditado)** — derivados de `getCurrentUser`/`getCurrentOrganization` em todas as 11 server actions; `team` recebe `userId` só como ALVO, escopado ao org derivado + RLS.
- [x] Helpers de permissão cobrem leitura/escrita/admin/billing **(auditado)** — `server/permissions/index.ts`, espelhados na RLS.

## Pipeline / cron

- [x] `/api/cron/*` rejeita sem `CRON_SECRET` **(auditado)** — ambos os handlers fail-closed (401); `server/pipeline/cron.ts` nega se o segredo for ausente/vazio.
- [x] Saída da IA validada por Zod; inválida não é gravada **(auditado)** — `safeParseGenerated` por módulo; falha lança antes da transação; `tests/manual/verify-pipeline.ts`.
- [x] Teto de custo/tokens ativo; falha não publica **(auditado, corrigido)** — a auditoria achou que env não-numérica (ex.: `2,00`) virava `NaN` e DESLIGAVA o teto silenciosamente. Corrigido: `lib/parse-num.ts` (`numEnv`, fallback em NaN/≤0) em `server/env.ts`, + guard `Number.isFinite` no merge de `server/pipeline/run.ts`; regressão `tests/unit/parse-num.test.ts`.

## Sessão

- [x] Limite de dispositivos funciona e gera `access_logs` **(auditado, corrigido)** — a auditoria achou que só o login por SENHA chamava `recordLogin`; sessões de `/api/auth/callback` (confirmação de e-mail/OAuth/magic-link) nasciam sem `user_sessions`/`access_logs` e escapavam do limite. Corrigido: `app/api/auth/callback/route.ts` agora chama `recordLogin`. Lógica de revogação testada (`tests/unit/device-limit.test.ts`).
- [x] Sessão revogada não consegue navegar **(auditado, corrigido)** — mesmo fix: sessões de callback agora têm cookie de device + linha em `user_sessions`, então o `middleware.ts` consegue bloqueá-las quando `is_active=false`.

## LGPD / dados

- [x] Política de privacidade publicada — `/privacy`. **Termos de uso** — `/termos` (linkados no rodapé, cadastro e settings).
- [x] Fluxo de exclusão de conta funcional **(auditado, corrigido)** — a auditoria achou que a exclusão era silenciosamente reversível (soft-delete sem gate; `deleteAuthUser` best-effort; assinatura/membership intactas → relogin restaurava acesso). Corrigido: `purgeAccountAccess` (service role) soft-deleta o perfil + **remove membership** (corta `has_active_subscription`) + deleta auth user; **gate de `deleted_at`** no login por senha (`server/actions/auth.ts`) e no callback bloqueia reentrada; `0009` impede auto-ressurreição.
- [x] Retenção automática de logs e conteúdo **(auditado)** — `runLifecycle` arquiva expirados, limpa `raw_signals` (7d) e `access_logs`/`audit_logs` (180d).

## Operacional (exige config no deploy)

- [x] Sentry capturando erros de servidor e do pipeline — `@sentry/nextjs` integrado: `instrumentation.ts` + `sentry.{server,edge}.config.ts` + `instrumentation-client.ts` + `onRequestError`; `withSentryConfig` no `next.config.mjs`. **Gated no DSN** (no-op sem `SENTRY_DSN`). Deploy: criar projeto no Sentry e setar `SENTRY_DSN` (+ `NEXT_PUBLIC_SENTRY_DSN`) na Vercel.
- [x] Alertas de falha do pipeline chegam à equipe — `Sentry.captureException` no catch do pipeline (`server/pipeline/run.ts`, tag `area:pipeline`) e nas crons (`app/api/cron/*`). Chega no Sentry quando o DSN está setado (configurar alertas no painel Sentry).
- [~] Backup do banco configurado — habilitar PITR/backup automático no projeto Supabase (painel). **Ação sua** — ver instruções abaixo.
- [x] Rate limiting ativo em login/cadastro/geração sob demanda **(auditado)** — `server/rate-limit` aplicado em `signIn`/`signUp`/`generation`; `tests/unit/rate-limit.test.ts`. _(Recuperação de senha: slot existe mas o fluxo ainda não existe no app. Limiter em memória — trocar por Upstash para limite distribuído multi-instância.)_
