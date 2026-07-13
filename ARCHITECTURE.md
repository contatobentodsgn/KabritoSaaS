# ARCHITECTURE.md

Como o sistema **realmente funciona hoje**, não como foi planejado. `TECHNICAL_SPEC.md`
é o documento de design original (pré-implementação, algumas seções já defasadas —
ex.: descreve Stripe como "futuro", já implementado); este arquivo reflete o código
atual e é atualizado junto com ele. Para a visão de produto, `PROJECT_MASTER_DOCUMENT.md`.

## Estrutura real (verificada no código, não aspiracional)

```
app/
  (auth)/{login,register,recuperar-senha}/
  (dashboard)/{dashboard,daily-briefing,trends,headlines,prompts,favorites,
               calendario,adaptar,settings,convite}/
  (admin)/admin/{review,sources,prompts,runs,cards,analytics}/
  api/{cron,webhooks,auth,csp-report}/
  verificar/  redefinir-senha/  privacy/  termos/          # top-level, fora dos grupos

components/{ui,forms,layout,dashboard,content,admin,landing}/

server/
  actions/       # Server Actions — única porta de entrada de mutação da UI
  services/      # regras de negócio (leitura/composição)
  auth/          # session, mfa (AAL2, recovery codes)
  permissions/   # requireAuth, requireStaff, requireActiveSubscription...
  audit/         # audit-system: gravação + isLoginLockedOut
  rate-limit/    # buckets por ação, Upstash Redis com fallback em memória
  admin/         # ISOLADO: service-role (Supabase admin API + storage + billing)
  pipeline/      # ISOLADO: ingest → generate → draft (cron)
  db/            # service-client (Drizzle/DATABASE_URL) — ISOLADO

db/{schema.ts, migrations/, migrate.ts, seed.ts}
lib/{supabase, validations, utils, constants, security, env.ts}
tests/{rls, unit, manual}
eslint-rules/    # regras locais: no-secrets-in-client, no-raw-danger
middleware.ts
```

## A regra central: dois caminhos de acesso ao banco, nunca misturados

Todo o resto do sistema existe em função desta fronteira:

- **Cliente de usuário** (`lib/supabase/server.ts`, JWT da sessão) — RLS sempre
  aplicada. É o caminho **padrão**; toda Server Action de usuário final passa por aqui.
- **Service-role** — dois sabores, com implicações diferentes:
  - `server/db/service-client.ts` (Drizzle, `DATABASE_URL` direto) conecta como
    dono das tabelas (role `postgres`) — RLS irrelevante, acesso total implícito.
  - `server/admin/supabase-admin.ts` (`createAdminSupabase()`, `SUPABASE_SERVICE_ROLE_KEY`)
    passa pelo PostgREST como role `service_role` — **BYPASSRLS, mas ainda precisa de
    GRANT de tabela** (RLS só é avaliada depois do grant; sem grant é "permission
    denied", não um bypass silencioso). Toda tabela nova precisa conceder
    explicitamente o que este caminho usa — o grant de `migration 0001` não é retroativo.

Os dois caminhos service-role só podem ser importados de `server/pipeline/`,
`server/admin/` e `app/api/cron/` — **ESLint** (`eslint.config.mjs`, boundaries)
barra o import fora dessas pastas. Essa é a defesa que garante que nenhuma Server
Action de usuário final acidentalmente ignore RLS.

## Autenticação e MFA (AAL1/AAL2)

- Supabase Auth (e-mail+senha). 2FA opcional via TOTP (`server/auth/mfa.ts`),
  atrás do flag `MFA_ENFORCE` (`lib/security/mfa.ts`).
- **Gate em duas camadas**: layouts (`(dashboard)`, `(admin)`) redirecionam pra
  `/verificar` em toda NAVEGAÇÃO se a sessão está em aal1 com 2FA pendente; Server
  Actions sensíveis (equipe, exclusão de conta, aprovação de edição) chamam
  `requireAal2()` diretamente — necessário porque uma Server Action é um POST que
  não re-executa o corpo do layout.
- **Recovery codes** (10 códigos/uso único, hash sha256) resolvem o lockout de quem
  perde o autenticador sem depender do CLI admin (`mfa:reset`) — ver `server/auth/mfa.ts`.
- **Bloqueio progressivo de login**: 8 falhas/15min por e-mail (case-insensitive),
  fail-open em caso de erro na própria checagem (`isLoginLockedOut`).

## Pipeline de geração (cron diário)

`ingest → generate (Zod por módulo) → draft → revisão humana → publish + e-mail → lifecycle`

Orquestrado em `server/pipeline/run.ts`, acionado por `app/api/cron/generate-edition`
(Vercel Cron, protegido por `CRON_SECRET`). Nunca publica sem aprovação humana — a
IA só grava `draft`; falha em qualquer módulo não derruba os outros nem publica cru.

## Camadas de segurança implementadas (resumo — detalhe em `SECURITY_GUIDE.md`)

- **CSP enforcing** com nonce por requisição + `strict-dynamic` (`middleware.ts` +
  `lib/security/csp.ts`); Trusted Types em Report-Only (não enforcing — os 3 usos
  legítimos de `dangerouslySetInnerHTML`, todos numa allowlist auditada, quebrariam).
- **Rate-limit** por ação (login, MFA, upload de avatar, export de dados, aceitar
  convite...) via Upstash Redis com fallback em memória por instância.
- **Auditoria** (`audit_logs`/`access_logs`) para login, mudança de senha, ações
  administrativas, uso de recovery code.
- **Headers cross-origin** (COOP/CORP same-origin; COEP deixado de fora de propósito
  — quebraria o avatar servido pelo Supabase Storage).
- **CI**: branch protection (PR obrigatório, checks obrigatórios) + gitleaks
  (arquivo + histórico completo) + Dependabot (alerts + security updates).

## Testes

- `tests/rls/*` — RLS contra Postgres real (não mockado): cada policy nova só é
  considerada verificada depois de rodar contra `scripts/setup-local-db.sh` (que
  emula roles/`auth.uid()` do Supabase) ou o Postgres efêmero do CI.
- `tests/unit/*` — lógica pura (rate-limit, lockout, validações).
- `tests/manual/*` — fluxos caros de automatizar (provisionamento, pipeline, billing).

## Decisões arquiteturais (ADR)

O "porquê" por trás de escolhas não-óbvias e difíceis de reverter, quando o
código sozinho só mostra o "o quê" — ver `docs/adr/`:

- [ADR-0001](docs/adr/0001-rls-como-camada-primaria-de-acesso.md) — RLS como
  camada primária de controle de acesso, com service-role isolado por diretório.
- [ADR-0002](docs/adr/0002-conteudo-editorial-global-sem-organization-id.md) —
  conteúdo editorial é global (sem `organization_id`), apesar do modelo
  multi-tenant.
- [ADR-0003](docs/adr/0003-cache-opt-in-em-getEditionWithModules.md) — cache de
  `getEditionWithModules` é opt-in, não o padrão.
- [ADR-0004](docs/adr/0004-migrations-sql-manuais-sequenciais.md) — migrations
  são SQL sequencial escrito à mão, não geradas integralmente pelo Drizzle Kit.
- [ADR-0005](docs/adr/0005-confirmdialog-sem-dependencia.md) — `ConfirmDialog` é
  hand-rolled, sem dependência de biblioteca de Dialog.
