# Inteligência Criativa — SaaS (automação-first)

Central diária de inteligência criativa para criadores de conteúdo e social media.
A IA **gera**; a equipe humana só **revisa/aprova**. Falha no pipeline **nunca publica**.

> Documentação espelhada ao **código real** (ROADMAP Fase 9). Fonte da visão:
> `PROJECT_MASTER_DOCUMENT.md`. Arquitetura atual: `ARCHITECTURE.md`. Segurança:
> `SECURITY_GUIDE.md` + `SECURITY_CHECKLIST.md`. Contribuindo: `CONTRIBUTING.md`.
> Histórico de mudanças: `CHANGELOG.md`. Decisões arquiteturais: `docs/adr/`
> (linkadas em `ARCHITECTURE.md`).

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind + shadcn/ui ·
Supabase Auth (2FA/TOTP + recovery codes) · PostgreSQL + RLS · Drizzle ORM · Zod ·
Vercel (deploy + cron) · Resend (e-mail) · Sentry · Stripe (billing, feature-flagged
por `STRIPE_ENABLED`) · Upstash Redis (rate-limit distribuído, opcional).

## As 8 restrições inegociáveis e onde são impostas

1. **Plano único** — sem tiers/`is_premium`. `plans` tem 1 linha; acesso = assinatura ativa.
   → `server/admin/billing.ts` (`ensureSinglePlan`), RLS `has_active_subscription()`.
2. **Automação-first** — IA gera draft; humano aprova; falha não publica.
   → `server/pipeline/run.ts` (tudo nasce `draft`), `server/actions/admin.ts` (`approveEdition`).
3. **Drizzle × RLS** — `service_role`/Drizzle direto só em pipeline/cron/admin; usuário sempre via cliente Supabase (JWT).
   → `server/db/service-client.ts` (isolado, `server-only`) vs `lib/supabase/server.ts`; **ESLint** bloqueia o import fora das pastas isoladas (`eslint.config.mjs`).
4. **Conteúdo editorial global** — sem `organization_id` no domínio editorial. → `db/schema.ts` domínio A.
5. **Sem scraping** — ingestão só de fontes autorizadas (rss/api/trends/seed). → `server/pipeline/ingest/`.
6. **Multi-tenant latente** — `organization` criada no cadastro, **invisível na UX** (sem seletor/gestão). → `server/admin/provisioning.ts`, layouts.
7. **Zod em toda entrada** — `lib/validations/*`, schemas Zod de saída da IA em `pipeline/generation-schemas.ts`.
8. **Nada secreto no client** — segredos em `server/env.ts` (`server-only`, falha o build se importado no client) + regra ESLint `no-secrets-in-client`.

## Estrutura (resumo — TECHNICAL_SPEC §1)

```
app/(auth|dashboard|admin)  · app/api/cron/{generate-edition,lifecycle} · app/api/webhooks/stripe
components/{ui,forms,layout,dashboard,content,admin}
server/{auth,permissions,actions,services,audit,rate-limit,admin,pipeline,db,env.ts}
db/{schema.ts, migrations/, migrate.ts, seed.ts}
lib/{supabase,validations,utils,constants,env.ts}
tests/{rls,unit,manual}  ·  eslint-rules/  ·  middleware.ts
```

## Rodando localmente

Requisitos: Node 20+ e PostgreSQL 16 (`brew install postgresql@16`).

```bash
npm install
cp .env.example .env.local        # preencha Supabase/AI/Resend para produção
bash scripts/setup-local-db.sh    # sobe Postgres local + bootstrap (emula Supabase) + migrations
npm run db:seed                   # plano único + plataformas + nichos + tags + prompt + fontes + dados de demo
npm run dev
```

> O `setup-local-db.sh` cria um Postgres local que **emula o Supabase** (roles `anon`/`authenticated`/`service_role` + `auth.uid()`), para os testes de RLS rodarem de verdade. Em produção use o Supabase real (esses objetos já existem) — rode só as migrations `0000`→`0003`.

Com o servidor local rodando, `/dev/ui` mostra uma vitrine dos componentes de UI mais usados (botões, badges, cards, campos, glossário/tooltip, confirm dialog...) isolados — alternativa leve a Storybook. **Só existe em dev**: a rota chama `notFound()` (e o `middleware.ts` já bloqueia `/dev/*` com 404 no edge) sempre que `NODE_ENV=production`.

### Pipeline (gerar edição draft)

```bash
npm run pipeline:run -- instagram        # usa provider MOCK se AI_API_KEY vazio
```

Sem `AI_API_KEY`, um provider mock gera saída válida; com a chave, chama a Anthropic.

### Conceder acesso manualmente (MVP, sem Stripe)

```bash
npm run grant -- usuario@email.com 365
```

## Scripts

`npm run help` lista todos os scripts abaixo, categorizados, direto no terminal.

```bash
# Dev / build
npm run dev              # servidor local
npm run build             # build de produção
npm run start              # serve o build

# Qualidade (mesmos comandos do CI — ver ".github/workflows/ci.yml")
npm run typecheck         # tsc --noEmit
npm run lint               # ESLint (inclui jsx-a11y + regras locais de segredo/dangerouslySetInnerHTML)
npm run format:check      # Prettier --check (o pre-commit já roda --write via lint-staged)
npm run format              # Prettier --write no repo inteiro
npm run audit:deps        # npm audit, deps de produção, high+ (sinal não-bloqueante no CI)
npm run deadcode           # knip — exports/arquivos/deps sem uso (sinal não-bloqueante no CI)

# Banco de dados
npm run db:generate       # gera migration a partir de db/schema.ts (Drizzle Kit)
npm run db:gen-types       # gera types TS do schema do Supabase (types/supabase.ts)
npm run db:migrate         # aplica migrations pendentes
npm run db:seed              # plano único + plataformas + nichos + tags + prompt + fontes + dados de demo
npm run seed:editions      # edições de exemplo via pipeline real (dev/demo)
npm run seed:test-user    # usuário de teste (dev)
npm run setup:storage      # cria os buckets do Supabase Storage (avatares)
npm run db:backup           # dump do banco

# Verificação de integrações externas (lê .env.local, não altera nada)
npm run check:supabase    # conectividade + schema
npm run check:upstash     # rate-limit distribuído (Redis)
npm run check:resend       # envio de e-mail

# Testes
npm run test                 # vitest: unit (device-limit, rate-limit, MFA lockout...)
npm run test:rls             # vitest: RLS contra Postgres local (precisa de scripts/setup-local-db.sh rodando)

# Operação / CLI admin (produção — usam SUPABASE_SERVICE_ROLE_KEY)
npm run pipeline:run -- <plataforma>     # roda o pipeline de geração manualmente
npm run grant -- <email> <dias>          # concede acesso manualmente (sem Stripe)
npm run staff -- <email> <role>          # promove/rebaixa staff (editor/superadmin)
npm run mfa:reset -- <email>             # remove 2FA de uma conta (perda de autenticador, sem recovery code)
```

`tests/rls/rls.test.ts` é o teste-âncora: cliente respeita RLS, `service_role` ignora; assinatura controla leitura; isolamento; escrita restrita. `tests/manual/verify-*.ts` cobre fluxos que não valem a pena automatizar (provisionamento, pipeline, lifecycle, billing) — rode com `node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-pipeline.ts`.

**CI** (`.github/workflows/ci.yml`, obrigatório pra mergear em `main` — branch protection): job `gate` roda typecheck/lint/format:check/test (com Postgres efêmero, RLS incluída) e `secrets-scan` (gitleaks, arquivos + histórico). Job `signals` (deps vulneráveis, código morto) é informativo, não bloqueia.

## Ciclo diário (PROJECT §2)

`ingest → generate (Zod, módulo a módulo) → DRAFT → REVISÃO humana → publish + e-mail → lifecycle`

- Cron `generate-edition` (06:00) e `lifecycle` (04:00) em `vercel.json`, protegidos por `CRON_SECRET`.

## Deploy (produção)

1. Projeto Supabase: aplicar migrations `db/migrations/0000`→`0003` (pular `bootstrap.local.sql`).
2. Vercel: variáveis de `.env.example` (todas as secret-only no server). Configurar `CRON_SECRET` (o Vercel Cron envia `Authorization: Bearer $CRON_SECRET`).
3. Resend: `RESEND_API_KEY` + `EMAIL_FROM` para o digest.
4. Antes de dados reais: rodar o `SECURITY_CHECKLIST.md` inteiro.
