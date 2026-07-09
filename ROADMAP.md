# ROADMAP.md

Fases de construção, ordenadas. Cada fase tem critérios de aceite. Não pular para a fase seguinte sem fechar a anterior, especialmente os itens de segurança.

---

## Fase 0 — Fundação (antes de qualquer feature)

1. Projeto Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
2. Estrutura de pastas conforme `TECHNICAL_SPEC.md` §1.
3. Supabase configurado; Drizzle com `db/schema.ts`; migrations rodando.
4. Dois clientes de banco isolados: `user-client` (JWT) e `service-client` (service_role).
5. Lint que bloqueia import do `service-client`/`SUPABASE_SERVICE_ROLE_KEY` fora de `pipeline/`, `admin/`, `cron/`.
6. `.env.example` preenchido.

**Aceite:** app sobe; migrations aplicadas; lint de isolamento de segredo funcionando.

---

## Fase 1 — Auth + multi-tenant latente

1. Login, cadastro, logout (Supabase Auth).
2. Pós-cadastro cria `profiles` + `organizations` (oculta) + `organization_members` (owner), em transação.
3. `middleware.ts` protege rotas privadas e faz os redirects.
4. Helpers: `getCurrentUser`, `getCurrentOrganization`, `requireAuth`.

**Aceite:** fluxo completo de auth; org criada automaticamente; rotas protegidas; sem seletor de org na UI.

---

## Fase 2 — RLS por domínio + testes

1. RLS habilitada em todas as tabelas sensíveis.
2. Policies dos 4 domínios (`SECURITY_GUIDE.md` §6).
3. Testes de RLS: teste-âncora (6.1), assinatura (6.2), isolamento (6.3), escrita restrita (6.4).

**Aceite:** todos os testes de RLS passam; teste-âncora prova que cliente respeita e service_role ignora.

---

## Fase 3 — Conteúdo + leitura autorizada

1. Render dos módulos de conteúdo (briefing, trend, copy, visual, headline, suggestion, prompt).
2. Dashboard + página de edição diária (Instagram).
3. `requireActiveSubscription` + `canReadEdition` aplicados.
4. Favoritos (criar/remover/listar) com RLS própria.

**Aceite:** assinante ativo vê edição publicada; sem assinatura não vê; favoritos isolados por usuário.

---

## Fase 4 — Admin + fila de revisão

1. `/admin` restrito a staff (`editor`/`superadmin`).
2. Fila de revisão: listar `draft`, aprovar/editar/rejeitar (item e edição).
3. Aprovar → `published` + `publish_date`. Rejeitar → motivo registrado.
4. CRUD de fontes de ingestão, prompts, categorias, nichos, tags, plataformas.

**Aceite:** staff revisa e publica; usuário comum não acessa `/admin`; nada publica sem aprovação.

---

## Fase 5 — Pipeline de geração

1. `server/pipeline/run.ts`: ingest → generate (módulo a módulo, Zod) → draft.
2. Conectores de ingestão (1–2 fontes legais + seed manual).
3. Geradores usando `pipeline/generator-prompts.md` + `generation-schemas.ts`.
4. `generation_runs` com tokens/custo/erro; teto de custo por run.
5. Cron `generate-edition` protegido por `CRON_SECRET`; idempotência por `(platform, date)`.

**Aceite:** rodar o cron gera uma edição `draft` válida; saída inválida não grava; falha não publica; custo registrado.

---

## Fase 6 — Publicação + e-mail + ciclo de vida

1. E-mail digest (Resend/Brevo) disparado na publicação.
2. Cron `lifecycle`: aplica retenção única (arquiva/expira) e limpa `raw_signals`.
3. `content_expires_at` calculado a partir de `plans.retention_days`.

**Aceite:** publicar dispara e-mail; conteúdo expira automaticamente; leitura respeita expiração.

---

## Fase 7 — Sessão + auditoria + rate limit

1. Controle de sessão por limite de dispositivos (N configurável).
2. `audit_logs` para eventos-chave; `access_logs` para login/revogação.
3. Estrutura de rate limiting (simples agora; preparada para Upstash).

**Aceite:** login no N+1 revoga o mais antigo; eventos auditados; rate limit ativo em login/cadastro.

---

## Fase 8 — Billing preparado (sem Stripe)

1. `plans` com uma linha (mensal + anual). `subscriptions` funcional.
2. Concessão de acesso manual no MVP.
3. TODOs estruturados para Stripe (com validação de webhook no futuro).

**Aceite:** assinatura ativa libera conteúdo; sem cobrança real implementada.

---

## Fase 9 — Documentação + checklist de produção

1. `PROJECT_MASTER_DOCUMENT.md` e `SECURITY_GUIDE.md` atualizados ao código real.
2. Rodar o **checklist de produção** (`SECURITY_GUIDE.md` §11) inteiro.
3. LGPD: política, exclusão de conta, retenção de logs.

**Aceite:** checklist 100% marcado antes de qualquer deploy com dados reais.

---

## Depois do MVP (resumo)

- **MVP 2:** LinkedIn/Threads; Trend Translator e "adaptar para meu nicho" (generativos sob demanda, com rate limit); coleções de favoritos; mais fontes de ingestão; analytics de uso para melhorar prompts.
- **MVP 3:** TikTok; gerador de calendário; workspace de agência (ativa a org na UX); Stripe; comunidade.
