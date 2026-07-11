# CONTRIBUTING.md

## Setup

Ver "Rodando localmente" no `README.md`. Resumo: `npm install` → `.env.local` →
`scripts/setup-local-db.sh` (Postgres local que emula o Supabase) → `npm run db:seed`
→ `npm run dev`.

## Fluxo de branch/PR

- **Nunca commitar direto em `main`** — branch protection bloqueia (PR obrigatório,
  checks de CI obrigatórios, force-push e deleção de `main` bloqueados).
- 1 branch por mudança pequena e independente: `git checkout -b tipo/descricao-curta`.
- Abrir PR cedo (`gh pr create`); os checks do CI (`gate` + `secrets-scan`) precisam
  passar antes do merge. O job `signals` (deps vulneráveis, código morto) é
  informativo — não bloqueia, mas vale olhar.
- Squash ou merge normal, à sua escolha; a branch pode ser deletada depois do merge.

## Commits

`tipo(escopo): descrição curta` — segue o histórico do repo (`git log --oneline`).
Tipos usados: `feat`, `fix`, `refactor`, `perf`, `style`, `ci`, `chore`, `docs`.
Escopo é livre (área do código: `security`, `ui`, `deps`, `a11y`...). Referencie o
ID do item quando vier do `IMPROVEMENTS-PLAN.md` (ex.: `(SEC-3)`), se aplicável.

```
fix(security): bloqueio progressivo por conta após logins falhos (SEC-4)
feat(billing): idempotência + anti-replay no webhook do Stripe
refactor(ui): componente único de Badge de status (UI-3)
```

## Antes de abrir o PR

```bash
npm run typecheck
npm run lint
npm run format:check     # ou `npm run format` pra corrigir
npm test                 # unit; roda tests/rls/* também se houver Postgres local
```

O `pre-commit` (Husky + lint-staged) já roda `eslint --fix` + `prettier --write`
nos arquivos staged automaticamente — a maior parte disso não deveria pegar você
de surpresa no CI.

## Regras que o lint/CI impõem (não são só estilo)

- **Segredos nunca no client.** Import de `server/env.ts` fora de arquivo
  `server-only`, ou uso direto de `process.env.<SEGREDO>` num componente client,
  é barrado pela regra local `no-secrets-in-client`.
- **`service_role`/Drizzle direto só em `server/pipeline/`, `server/admin/` e
  `app/api/cron/`.** Fora dessas pastas, RLS é obrigatória — ver "A regra central"
  em `ARCHITECTURE.md`. O boundary do ESLint barra o import errado antes de virar
  bug em produção.
- **`dangerouslySetInnerHTML`** só nos 3 arquivos da allowlist revisada em
  `eslint-rules/no-raw-danger.js`. Se você genuinamente precisa de um 4º uso,
  adicione à allowlist NA MESMA PR e explique o porquê no corpo do PR.
- **Toda entrada de usuário passa por Zod** (`lib/validations/*`). Strings sem
  `.max()` são um alvo fácil de finding numa próxima auditoria — coloque um teto
  razoável mesmo que pareça óbvio.
- **RLS de tabela nova**: lembre do GRANT explícito (a policy sozinha não basta —
  ver "A regra central" em `ARCHITECTURE.md`). Teste contra Postgres real
  (`scripts/setup-local-db.sh`), não só `typecheck`.

## Documentos

`ARCHITECTURE.md` (como o sistema funciona hoje) e `SECURITY_GUIDE.md` (catálogo de
RLS/segurança) devem ser atualizados na mesma PR quando a mudança os torna
desatualizados — não depois. `IMPROVEMENTS-PLAN.md` é local (não versionado); não
precisa manter sincronizado num PR alheio, mas marque o item lá se resolveu um.
