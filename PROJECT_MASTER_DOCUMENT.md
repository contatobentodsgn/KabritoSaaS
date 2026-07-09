# SaaS de Inteligência Criativa — Documento Mestre (v2, automação-first)

> **O que mudou em relação à v1**
>
> 1. O produto deixa de ser uma operação editorial manual e passa a ser um **pipeline de geração automatizado**. A equipe humana atua **apenas na revisão/aprovação** do material gerado — nunca na produção.
> 2. **Plano único** (decisão definitiva). Não há tiers, gating premium nem retenção variável por plano.
> 3. O **modelo de dados foi corrigido**: conteúdo editorial é **global** (catálogo compartilhado), e foi separado dos **dados de usuário** (escopados). Isso elimina o `organization_id` indevido nas tabelas de conteúdo.
> 4. A **camada de ingestão de sinais** foi tornada explícita e legalmente segura (sem scraping de redes sociais).
> 5. A relação **Drizzle × RLS** foi resolvida com uma regra dura de uso da connection.

---

## 1. Visão geral

Uma central diária de inteligência criativa para criadores de conteúdo e social media. Todos os dias, o assinante recebe uma edição com pautas quentes, análises de copy e visuais, headlines, sugestões de posts e prompts prontos para adaptar ao seu nicho.

A diferença estrutural da v2: **a edição diária é produzida por um pipeline automatizado**. Um conjunto de rotinas coleta sinais de fontes autorizadas, gera o conteúdo com IA em formato estruturado, e enfileira o resultado para revisão humana. A única intervenção humana obrigatória é **aprovar, editar ou rejeitar** o material gerado antes da publicação.

Princípio que orienta todo o produto: **a máquina produz, a pessoa só revisa.**

---

## 2. Modelo operacional automatizado

Esta é a espinha dorsal da v2. O ciclo diário tem cinco estágios; apenas o estágio 3 exige uma pessoa.

```
[1] INGESTÃO          → coleta automática de sinais de fontes autorizadas
        ↓
[2] GERAÇÃO           → IA transforma sinais em edição estruturada (status: draft)
        ↓
[3] REVISÃO (humano)  → aprovar / editar / rejeitar na fila de revisão
        ↓
[4] PUBLICAÇÃO        → edição vira "published"; e-mail digest disparado
        ↓
[5] CICLO DE VIDA     → arquivamento/expiração automáticos por retenção
```

### Estágio 1 — Ingestão (automático)

Rotina agendada coleta sinais de fontes **legalmente seguras** (ver seção 7). Os itens brutos são salvos em `raw_signals`, vinculados a um `generation_run`.

### Estágio 2 — Geração (automático)

Para cada módulo da edição (briefing, pautas, análise de copy, análise visual, headlines, sugestões de post, prompts), uma rotina chama o modelo de IA com um prompt estruturado e exige **saída em JSON validável por Zod**. O resultado é gravado como uma edição com `status = draft` e `review_status = pending`. Toda a geração registra custo, tokens e a versão do prompt usado em `generation_runs`.

### Estágio 3 — Revisão (único passo humano)

A equipe abre a **fila de revisão** no admin e vê a edição gerada, item por item. Pode:

- **Aprovar** (item ou edição inteira);
- **Editar** o texto antes de aprovar;
- **Rejeitar** (com motivo, que volta como feedback para ajustar prompts).

Nenhuma edição vai ao ar sem aprovação. Esse é o ponto de controle de qualidade e o que protege a marca de erros da IA.

### Estágio 4 — Publicação (automático)

Ao aprovar, a edição passa a `published`, recebe `publish_date`, fica visível aos assinantes ativos e dispara o **e-mail digest** (Resend/Brevo).

### Estágio 5 — Ciclo de vida (automático)

Rotina diária aplica a política de retenção única (seção 10): arquiva/expira conteúdo antigo e limpa `raw_signals` já processados.

### Orquestração

- Agendamento via **Vercel Cron** (ou Supabase Scheduled Functions / Edge Functions com cron).
- Cada estágio é **idempotente**: rodar duas vezes no mesmo dia não duplica a edição (chave única por `platform_id + edition_date`).
- Falhas geram alerta (Sentry + e-mail interno) e **não publicam nada** — o pior caso é "não saiu edição hoje", nunca "saiu edição errada".
- Geração e publicação são desacopladas: a IA pode gerar de madrugada; a revisão acontece de manhã; a publicação ocorre na aprovação.

---

## 3. Plano único (definitivo)

Há **um único plano**. Quem tem assinatura ativa tem acesso total; quem não tem, não acessa o conteúdo. Isso simplifica produto, banco e segurança:

- Sem tiers, sem `is_premium`, sem gating por módulo.
- **Retenção única** para todos (seção 10).
- Autorização de leitura = "assinatura ativa", e mais nada.
- As tabelas `plans` e `subscriptions` permanecem (para Stripe futuro), mas `plans` terá **uma única linha**.

Oferta comercial sugerida dentro do plano único: cobrança **mensal** e **anual com desconto** (mesmo plano, dois ciclos de cobrança). Isso não cria tiers — é o mesmo acesso, períodos diferentes.

---

## 4. Arquitetura técnica

### Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase Auth · PostgreSQL com RLS · Drizzle ORM · Zod · Vercel (deploy + cron) · Cloudflare (DNS/proteção futura) · Sentry (monitoramento) · Resend ou Brevo (e-mail) · Stripe (preparado, não implementado agora).

Frontend e backend no mesmo projeto Next.js (Server Actions + Route Handlers). Sem backend separado.

### Regra crítica: Drizzle × RLS

A RLS no Postgres **só protege se a conexão respeitar o JWT do usuário**. Conexões com a connection string direta ou com a `service_role` rodam como dono do banco e **ignoram a RLS por completo**. Portanto:

| Tipo de operação                                    | Conexão                             | RLS                                |
| --------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Leitura/escrita disparada por requisição de usuário | Cliente Supabase com JWT do usuário | **Aplicada**                       |
| Pipeline de geração, cron, rotinas administrativas  | `service_role` / Drizzle direto     | **Ignorada (proposital, isolado)** |

Regra dura para o `SECURITY_GUIDE.md`: a `SUPABASE_SERVICE_ROLE_KEY` **só** é usada em rotinas do servidor isoladas (pipeline, cron, admin), **nunca** em queries originadas por requisição de usuário final. Drizzle é usado para schema/migrations e para o pipeline; as queries de usuário passam pelo cliente Supabase para que a RLS seja a rede de segurança real.

---

## 5. Modelo de dados revisado

O banco agora tem **quatro domínios claramente separados**:

```
A) CONTEÚDO EDITORIAL (global, sem org de cliente)
   - escrita: apenas pipeline e staff editorial
   - leitura: qualquer assinante ativo

B) INGESTÃO / PIPELINE (interno)
   - sinais brutos, runs de geração, custos

C) DADOS DE USUÁRIO / CONTA (escopado por user/org)
   - perfis, favoritos, sessões, logs

D) BILLING (plano único)
   - plans (1 linha), subscriptions
```

### A) Conteúdo editorial — GLOBAL (sem `organization_id`)

**platforms**
`id`, `name`, `slug`, `is_active`, `created_at`, `updated_at`

**content_editions**
`id`, `title`, `slug`, `summary`, `platform_id`, `edition_date`, `status` (draft|scheduled|published|archived), `review_status` (pending|in_review|approved|rejected), `generated_by_run_id`, `generation_prompt_version`, `reviewed_by` (staff user), `reviewed_at`, `published_at`, `content_expires_at`, `is_archived`, `created_at`, `updated_at`
_Restrição única: `(platform_id, edition_date)` — garante idempotência da geração._

**trend_items**
`id`, `edition_id`, `platform_id`, `title`, `context`, `why_it_matters`, `adaptation_tips`, `risk_level`, `saturation_level`, `opportunity_score`, `content_format`, `recommended_niches`, `created_at`, `updated_at`

**explore_reports** (Radar de Descoberta)
`id`, `edition_id`, `platform_id`, `title`, `summary`, `observed_patterns`, `recommendation`, `created_at`, `updated_at`

**copy_patterns**
`id`, `edition_id`, `title`, `observed_headline`, `hook_type`, `trigger_type`, `explanation`, `structure`, `adaptation_examples`, `tags`, `created_at`, `updated_at`

**visual_patterns**
`id`, `edition_id`, `title`, `visual_style`, `colors`, `typography_notes`, `composition_notes`, `why_it_works`, `how_to_adapt`, `tags`, `created_at`, `updated_at`

**headlines**
`id`, `edition_id`, `headline`, `category`, `trigger_type`, `why_it_works`, `adaptations`, `saturation_level`, `recommended_niches`, `created_at`, `updated_at`

**content_suggestions**
`id`, `edition_id`, `title`, `central_idea`, `recommended_format`, `suggested_headline`, `post_structure`, `caption_base`, `cta`, `recommended_niches`, `difficulty_level`, `opportunity_score`, `created_at`, `updated_at`

**prompt_categories** — `id`, `name`, `slug`, `description`, timestamps
**prompt_templates** — `id`, `category_id`, `title`, `objective`, `when_to_use`, `required_input`, `prompt_body`, `example_output`, `platform_id`, `tags`, `created_at`, `updated_at`

> Removido `is_premium` (plano único).

**niches** — `id`, `name`, `slug`, `description`, timestamps
**content_tags** — `id`, `name`, `slug`, timestamps

> **Nenhuma tabela deste domínio tem `organization_id`.** O conteúdo é o mesmo para todos. A autorização de leitura é "assinatura ativa + conteúdo publicado e não expirado".

### B) Ingestão / pipeline — INTERNO

**ingestion_sources**
`id`, `name`, `type` (api|rss|trends|manual_seed), `config` (jsonb: endpoint, chaves referenciadas por env, filtros), `is_active`, `last_run_at`, `created_at`, `updated_at`

**raw_signals**
`id`, `source_id`, `generation_run_id`, `platform_id`, `raw_payload` (jsonb), `collected_at`, `processed`, `created_at`

**generation_runs**
`id`, `edition_date`, `platform_id`, `status` (started|ingesting|generating|completed|failed), `prompt_version`, `model_used`, `input_tokens`, `output_tokens`, `cost_estimate`, `error_message`, `started_at`, `finished_at`, `created_at`

> Permite auditar custo de IA por dia, detectar regressões de qualidade por versão de prompt e reprocessar falhas.

### C) Dados de usuário / conta — ESCOPADO

**profiles** — `id`, `user_id`, `name`, `email`, `avatar_url`, `created_at`, `updated_at`

**organizations** — `id`, `name`, `slug`, `owner_id`, `created_at`, `updated_at`

> Mantida como container do usuário e base para o workspace de agências (futuro). **Invisível na UX do MVP** — criada automaticamente no cadastro, sem seletor, sem gestão de membros.

**organization_members** — `id`, `organization_id`, `user_id`, `role`, `created_at`, `updated_at`

**user_favorites** — `id`, `user_id`, `organization_id`, `entity_type`, `entity_id`, `collection_name`, `created_at`

> `entity_type` aponta para conteúdo global (headline, prompt, trend, etc.). O favorito é do usuário; o item favoritado é global.

**user_sessions** — `id`, `user_id`, `device_id`, `session_token_hash`, `user_agent`, `ip_address`, `last_seen_at`, `is_active`, `created_at`, `revoked_at`

**access_logs** — `id`, `user_id`, `organization_id`, `action`, `ip_address`, `user_agent`, `metadata`, `created_at`
**audit_logs** — `id`, `organization_id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`

### D) Billing — PLANO ÚNICO

**plans** — `id`, `name`, `slug`, `price_monthly`, `price_annual`, `billing_cycle`, `features` (jsonb), `retention_days`, `is_active`, `created_at`, `updated_at`

> Conterá **uma única linha ativa**.

**subscriptions** — `id`, `organization_id`, `plan_id`, `customer_id`, `subscription_status` (active|past_due|canceled|trialing), `current_period_start`, `current_period_end`, `created_at`, `updated_at`

---

## 6. Pipeline de geração — detalhe técnico

### Onde mora o código

```
server/pipeline/
  ingest/        → conectores por fonte (api, rss, trends)
  generate/      → geradores por módulo (briefing, trends, copy, visual, headlines, suggestions, prompts)
  prompts/       → templates de prompt versionados
  schemas/       → schemas Zod de saída de cada gerador
  run.ts         → orquestrador do ciclo diário
app/api/cron/
  generate-edition/route.ts   → endpoint acionado pelo Vercel Cron
  lifecycle/route.ts          → arquivamento/expiração
```

### Boas práticas obrigatórias do pipeline

- **Saída sempre validada por Zod.** Se a IA devolver algo fora do schema, o item é descartado/reprocessado, nunca salvo cru.
- **Prompts versionados.** Cada `generation_run` grava `prompt_version`. Isso permite saber qual versão gerou qual qualidade e reverter.
- **Idempotência por `(platform_id, edition_date)`.**
- **Teto de custo por run.** Se `cost_estimate` ou tokens passarem de um limite configurável, o run para e alerta. Protege contra fatura inesperada.
- **Endpoints de cron protegidos** por um segredo (`CRON_SECRET`) — não podem ser disparados publicamente.
- **Falha = não publica.** Erros nunca produzem conteúdo visível.

### Custo de IA

Registre tokens e custo por run desde o dia 1. Mesmo com plano único e geração ilimitada pelo lado do usuário, **a geração tem custo fixo diário** (uma edição por plataforma por dia), então o custo é previsível e baixo. As features generativas sob demanda (adaptar para meu nicho, Trend Translator) têm custo por uso e devem ter **rate limiting por usuário** (seção 9), mesmo no plano único, para evitar abuso.

---

## 7. Camada de ingestão de sinais (a parte honesta)

Automatizar a **geração** e a **formatação** é trivial. O difícil — e o que define a qualidade — é automatizar o **sinal de entrada** (o que de fato está em alta) **sem scraping de redes sociais**, que é instável e juridicamente arriscado.

Estratégia recomendada, em ordem de prioridade:

1. **APIs e feeds autorizados**: APIs oficiais quando disponíveis, agregadores de tendências, Google Trends, APIs de notícias/mídia, newsletters de marketing via RSS. Tudo configurável em `ingestion_sources`.
2. **Seed mínimo opcional**: um campo no admin onde alguém (em segundos) cola 2–3 links ou temas do dia, que a IA expande. É "humano", mas é trivial e não é "produção". Use como reforço, não como dependência.
3. **Banco evergreen**: nem todo conteúdo precisa ser do dia. Prompts, padrões de copy e padrões visuais atemporais são reutilizáveis e reduzem a pressão de ingestão diária. Misture perecível (trends) com atemporal (prompts/padrões).

**O que NÃO fazer:** prometer ou construir captura automática da aba Explorar do Instagram. Mantenha o nome "Radar de Descoberta" e a base de curadoria assistida por IA sobre fontes legais.

---

## 8. Segurança (RLS corrigida para o modelo global × usuário)

### Princípios (mantidos da v1)

Nunca confiar no frontend; autorização sempre no backend; validar tudo com Zod; segredos nunca no client; separar auth/permissions/queries/services/UI; auditoria e rate limiting preparados.

### RLS por domínio

**Conteúdo editorial (global):**

- **Leitura**: permitida se `status = 'published'` **E** `content_expires_at` no futuro **E** o usuário tem **assinatura ativa**. (Plano único → não há checagem de tier.)
- **Escrita**: apenas via `service_role` (pipeline) ou usuários com papel de staff editorial. Usuário final nunca escreve aqui.

**Ingestão/pipeline:** sem acesso de usuário final. Apenas `service_role`/staff.

**Dados de usuário:** `user_favorites`, `user_sessions`, `access_logs` → o usuário só vê/escreve as próprias linhas (`user_id = auth.uid()`). `organizations`/`organization_members` → só a organização onde é membro.

**Billing:** o usuário só vê a assinatura da própria organização.

> Garantia: mesmo que uma query esqueça de filtrar, a RLS bloqueia — **desde que a query passe pelo cliente Supabase com JWT** (ver seção 4).

### Itens adicionais

- IDOR: nunca aceitar `organization_id`/`user_id` vindo do frontend como fonte de verdade — sempre derivar do contexto autenticado.
- Webhooks do Stripe (futuro): validar assinatura do webhook.
- LGPD: base legal documentada, política de privacidade, fluxo de exclusão de conta e dados (`deleted_at` já previsto), retenção de logs definida.

---

## 9. Roles e permissões (simplificados)

Com automação + plano único, separamos **clientes** de **equipe interna**:

**Clientes (assinantes)**

- `subscriber` — papel padrão. Lê conteúdo publicado se a assinatura está ativa; favorita; acessa histórico dentro da retenção. Não acessa admin nem pipeline.

**Equipe interna (staff)**

- `editor` — acessa a fila de revisão; aprova/edita/rejeita conteúdo gerado; gerencia prompts, nichos, plataformas, fontes de ingestão.
- `superadmin` — tudo do editor + configuração de pipeline, custos, usuários internos.

**Estrutura org (latente, para agências no futuro):** `owner` / `admin` / `member` permanecem no schema mas não são expostos na UX do MVP.

**Helpers de permissão (backend):**
`getCurrentUser()` · `getCurrentOrganization()` · `requireAuth()` · `requireActiveSubscription()` · `canReadEdition(edition)` · `requireStaff()` · `requireEditor()` · `canReviewContent()` · `canManagePipeline()` · `withinDeviceLimit()`

**Rate limiting** (preparado, Upstash futuro): login, cadastro, recuperação de senha, **chamadas de geração sob demanda por usuário**, endpoints de cron (via `CRON_SECRET`).

---

## 10. Retenção única

Plano único → **uma só política de retenção** para todos:

- Conteúdo editorial publicado: disponível por **N dias** (defina N — sugestão 30 a 90; campo `retention_days` em `plans`).
- Favoritos do usuário: mantidos enquanto a assinatura estiver ativa.
- Prompts base: permanentes.
- `raw_signals` processados: limpos após poucos dias.

Campos: `content_expires_at`, `is_archived`, `deleted_at`. Rotina diária de ciclo de vida aplica tudo automaticamente.

---

## 11. Controle de sessão (limite de dispositivos)

Em vez de "1 conta = 1 sessão" (que pune o uso legítimo celular + desktop), use **limite de N dispositivos ativos** (sugestão: 2). Ao logar no dispositivo N+1, o mais antigo é revogado. Combina `device_id` + `user_agent` + `last_seen_at` + `session_token_hash`, com `access_logs` para auditoria. Bloqueia compartilhamento casual sem irritar o assinante real. `N` configurável.

---

## 12. MVP enxuto

**MVP 1 (foco: provar o pipeline + a qualidade revisada)**

1. Auth (login/cadastro/logout) + middleware de proteção.
2. Criação automática de profile + organization (oculta) no cadastro.
3. **Pipeline de geração** com ingestão básica (1–2 fontes legais + seed manual) → edição em draft.
4. **Fila de revisão** no admin (aprovar/editar/rejeitar).
5. Publicação + **e-mail digest** (Resend/Brevo) — _core de retenção, não adiar_.
6. Dashboard + edição diária do Instagram.
7. Módulos de conteúdo essenciais: pautas, copy, visual, headlines, sugestões, prompts.
8. Favoritos.
9. Retenção única automática.
10. Controle de sessão por limite de dispositivos (versão simples).
11. Zod em todas as entradas; helpers de permissão; RLS por domínio.
12. Estrutura de assinatura preparada (sem Stripe).
13. `.env.example`, `PROJECT_MASTER_DOCUMENT.md`, `SECURITY_GUIDE.md`.

**MVP 2:** LinkedIn/Threads; Trend Translator e "adaptar para meu nicho" (generativos sob demanda, com rate limit); favoritos em coleções; mais fontes de ingestão; analytics de uso para melhorar prompts.

**MVP 3:** TikTok; gerador de calendário; workspace de agência (ativa a org na UX); Stripe; comunidade.

---

## 13. Riscos e mitigações

| Risco                                         | Mitigação                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| IA publica erro/algo fora de marca            | Revisão humana obrigatória antes de publicar; falha nunca publica                     |
| Sinal de entrada fraco/ilegal                 | Fontes autorizadas + seed mínimo + banco evergreen; sem scraping                      |
| Custo de IA descontrolado                     | Teto por run, log de tokens/custo, rate limit em geração sob demanda                  |
| RLS "decorativa" por uso errado da connection | Regra dura: service_role só no pipeline/cron; queries de usuário via cliente Supabase |
| Conteúdo global modelado como tenant          | Schema separa global × usuário; conteúdo sem organization_id                          |
| Baixa retenção em produto "diário"            | E-mail digest no MVP 1; banco evergreen para dias sem trends fortes                   |
| Compartilhamento de conta                     | Limite de dispositivos, não sessão única                                              |
| Banco crescendo sem controle                  | Retenção única automática + limpeza de raw_signals                                    |
| LGPD                                          | Base legal, política, exclusão de conta, retenção de logs documentadas                |

---

## 14. Ordem de implementação recomendada

1. Base do projeto (Next.js, TS, Tailwind, shadcn/ui) + `.env.example`.
2. Supabase + schema (4 domínios) + migrations Drizzle.
3. RLS por domínio + testes de RLS (incluindo o teste "service_role ignora RLS / cliente respeita").
4. Auth + criação automática de profile/org + middleware.
5. Dashboard + leitura de edição publicada (com `requireActiveSubscription`).
6. Admin: fila de revisão + CRUD de fontes/prompts/nichos.
7. Pipeline: ingestão → geração (Zod) → draft → publicação + e-mail.
8. Cron (Vercel) protegido por `CRON_SECRET` + rotina de ciclo de vida.
9. Favoritos + controle de sessão por dispositivos.
10. Auditoria + rate limiting (estrutura) + `SECURITY_GUIDE.md`.
11. Preparar billing (plano único) sem Stripe.

---

## 15. Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # apenas servidor: pipeline/cron/admin
DATABASE_URL=                   # apenas servidor: Drizzle/migrations
CRON_SECRET=                    # protege endpoints de cron
AI_API_KEY=                     # provedor de IA do pipeline
RESEND_API_KEY=                 # (ou BREVO_API_KEY)
SENTRY_DSN=
STRIPE_SECRET_KEY=              # futuro, não usar agora
```

`NEXT_PUBLIC_*` podem ir ao client. Todo o resto é segredo de servidor e **nunca** pode ser importado em componente client.
