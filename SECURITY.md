# Segurança — modelo de isolamento e dívidas conhecidas

Documento vivo da postura de segurança multi-tenant do Kabrito. Atualize-o
quando o modelo de tenant evoluir.

## Modelo de tenant

- **Tenant = organização.** Cadeia de posse: `auth.uid()` →
  `organization_members.user_id` → `organization_members.organization_id`.
- **Tabelas org-scoped** (isoladas por RLS, com negação cross-org testada):
  `organizations`, `organization_members`, `subscriptions`, `org_invites`.
  Cobertura em `tests/rls/rls.test.ts` — leitura cross-org (bloco 6.3) e
  **escrita** cross-org (bloco 6.12).
- **Conteúdo editorial e pipeline são GLOBAIS por design** (sem
  `organization_id`): o acesso é gated por *assinatura ativa em qualquer org*
  (`has_active_subscription(auth.uid())`, `db/migrations/0001_rls.sql`), não pela
  org do usuário. É proposital no plano único atual — todo assinante vê o mesmo
  catálogo.

## Dívida latente — revisitar ANTES do multi-tenant "real"

Quando "agências amanhã" precisarem de **dados privados por organização**, estes
pontos precisarão mudar (hoje estão corretos, mas não isolam por org):

- **`user_favorites`, `access_logs`, `audit_logs`** têm coluna `organization_id`,
  mas a RLS **não a usa** — o escopo é só por `user_id` (favoritos/logs) ou
  só-staff (`audit_logs`). Ver `db/migrations/0001_rls.sql` (favorites ~157-159,
  access_logs ~167-171, audit_logs ~174-176). Quando coleções/logs forem
  compartilhados por org, as policies precisarão amarrar `organization_id` à
  membership (ex.: `is_org_member(auth.uid(), organization_id)`).
- **Conteúdo (edições, trends, headlines, prompts…)**: se um dia houver conteúdo
  privado por org, os domínios editorial/pipeline precisarão de `organization_id`
  + RLS por org — hoje são globais.

## Defesa-em-profundidade

- **`server/admin/**` usa o service-client (RLS ignorada)** por necessidade
  (operações cross-user/cross-org de sistema). As funções **revalidam o papel do
  ator na org internamente** (backstop anti-IDOR) — ver `actorRole()` em
  `server/admin/team.ts`. Nunca confiar só no gate da Server Action.
- **`org_id` sempre vem da sessão** (`getCurrentOrganization()` /
  `getCurrentOrgId()` em `server/auth/session.ts`), nunca do payload do cliente.
- **Webhook do Stripe** valida formato UUID + existência da org antes de gravar
  assinatura (`server/admin/stripe.ts`).
- **Publicação** exige `canReviewContent()` (staff) + RLS via JWT, e só publica
  edição em `review_status = 'pending'` (`server/actions/admin.ts`).

## Repositório público — modelo de ameaça

O código é **público** (necessário no plano Vercel Hobby). Premissa:
**assuma que o atacante leu todo o código** — nenhuma segurança por obscuridade.

- Segredos vivem **apenas** em variáveis de ambiente (Vercel / Supabase),
  **nunca** no repositório.
- `gitleaks` no CI varre **arquivos atuais + histórico completo** (`--all`).
- A isolação real é a **RLS no banco** + os backstops acima — não o sigilo do código.

## Guardrails automatizados (CI)

- `tests/rls/rls.test.ts` — isolamento multi-tenant (leitura + escrita cross-org,
  anti-escalada de privilégio, lockdown de `staff_role`/`deleted_at`).
- `typecheck` · `lint` · `npm test` · `gitleaks` (arquivos + histórico) a cada PR.

## Itens conhecidos em aberto (futuro)

- Atomicidade transacional de `approveEdition` + `recordAudit` (hoje o audit é
  best-effort e observável; atomicidade plena exigiria um RPC/migration).
- 2FA: recuperação sem o autenticador depende de unenroll por admin (Supabase TOTP
  não emite recovery codes nativos).
