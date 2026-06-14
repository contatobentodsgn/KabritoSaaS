# TECHNICAL_SPEC.md

Especificação técnica de implementação. Complementa o `PROJECT_MASTER_DOCUMENT.md` com detalhes concretos para construção.

---

## 1. Estrutura de pastas

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    dashboard/page.tsx
    daily-briefing/page.tsx
    trends/page.tsx
    headlines/page.tsx
    prompts/page.tsx
    favorites/page.tsx
    settings/page.tsx
  (admin)/
    admin/
      review/page.tsx          # fila de revisão (único passo humano)
      sources/page.tsx         # fontes de ingestão
      prompts/page.tsx         # prompts/categorias/nichos/tags
      runs/page.tsx            # histórico de generation_runs + custo
  api/
    cron/
      generate-edition/route.ts   # acionado por Vercel Cron (CRON_SECRET)
      lifecycle/route.ts          # arquivamento/expiração
  layout.tsx
  page.tsx

components/
  ui/            # shadcn/ui
  forms/
  layout/        # sidebar, header, user menu
  dashboard/     # cards de conteúdo, filtros
  content/       # render de cada módulo (briefing, trend, copy, etc.)
  admin/         # componentes da fila de revisão

server/
  actions/       # funções chamadas pela UI (Server Actions)
  services/      # regras de negócio
  auth/          # getCurrentUser, requireAuth...
  permissions/   # requireActiveSubscription, requireEditor, canReadEdition...
  audit/         # gravação de audit_logs
  rate-limit/    # estrutura de rate limiting
  pipeline/      # SERVICE_ROLE isolado aqui
    ingest/      # conectores por fonte
    generate/    # geradores por módulo
    prompts/     # prompts versionados
    schemas/     # re-export de pipeline/generation-schemas.ts
    run.ts       # orquestrador do ciclo diário
  db/
    user-client.ts     # cliente Supabase (JWT) -> RLS aplicada
    service-client.ts  # service_role / Drizzle direto -> RLS ignorada (isolado)

db/
  schema.ts      # ver db/schema.ts deste pacote
  queries/       # queries puras
  migrations/

lib/
  supabase/
  validations/   # schemas Zod de entrada (login, cadastro, filtros...)
  utils/
  constants/

types/

middleware.ts    # proteção de rotas
```

**Regra de lint:** proibir import de `server/db/service-client` e da `SUPABASE_SERVICE_ROLE_KEY` fora de `server/pipeline/`, `server/admin/` e `app/api/cron/`.

---

## 2. Configuração de stack

- **Next.js App Router** com Server Actions e Route Handlers.
- **Tailwind + shadcn/ui** como base visual. Componentes mínimos: Button, Input, Label, Card, Dialog, Dropdown, Table, Form, Toast/Sonner, Avatar, Badge, Tabs, Sheet, Select, Textarea.
- **Drizzle** para schema e migrations; ver §RLS para a divisão de conexões.
- **Supabase Auth** para autenticação.
- **Vercel Cron** para o pipeline diário.

Layout do dashboard: sidebar + header + área principal + menu do usuário. **Sem** seletor de organização no MVP.

---

## 3. Autenticação

- Páginas: login, cadastro, logout.
- Pós-cadastro (transação): cria `profiles`, cria `organizations` (container oculto), cria `organization_members` com role `owner`.
- `middleware.ts` protege `/dashboard`, `/daily-briefing`, `/trends`, `/headlines`, `/prompts`, `/favorites`, `/settings`, `/admin`. Redireciona deslogado → `/login`; logado tentando `/login`/`/register` → `/dashboard`.
- `/admin/*` exige role de staff (`editor`/`superadmin`).

---

## 4. RLS — catálogo de policies

> A RLS só vale para queries via cliente de usuário (JWT). Ver `SECURITY_GUIDE.md` §3.

**Conteúdo editorial (global):**
- SELECT permitido se `status='published'` **e** não expirado **e** o usuário tem assinatura ativa.
- INSERT/UPDATE/DELETE: negado para usuário final (feito por `service_role`/staff).

**Ingestão (`ingestion_sources`, `raw_signals`, `generation_runs`):** sem acesso de usuário final.

**Dados de usuário:**
- `user_favorites`, `user_sessions`, `access_logs`: `user_id = auth.uid()`.
- `organizations`/`organization_members`: só a org onde é membro.
- `profiles`: só o próprio.

**Billing:** `subscriptions` visível só para a org do usuário.

Esqueletos de policy em `SECURITY_GUIDE.md` §6.

---

## 5. Pipeline de geração

Ciclo diário (ver `PROJECT_MASTER_DOCUMENT.md` §2 e §6):

```
ingest → generate (Zod) → draft → REVIEW (humano) → publish + e-mail → lifecycle
```

**Orquestrador (`server/pipeline/run.ts`):**
1. Cria `generation_runs` (status=started).
2. Ingestão: cada conector salva em `raw_signals`.
3. Geração **módulo a módulo**: chama o modelo com o prompt versionado (ver `pipeline/generator-prompts.md`), valida com o schema Zod correspondente (`pipeline/generation-schemas.ts`). Saída inválida → log em `generation_runs.error_message`, reprocessa o módulo; nunca grava cru.
4. Persiste a edição como `draft` / `review_status=pending`.
5. Atualiza `generation_runs` (tokens, custo, status=completed).

**Regras:**
- Idempotência por `(platform_id, edition_date)`.
- Teto de custo/tokens por run → estoura, para e alerta (Sentry).
- Falha em qualquer ponto **não publica**.

**Cron (`app/api/cron/generate-edition/route.ts`):**
- Valida header com `CRON_SECRET` (401 sem ele).
- Chama o orquestrador para a(s) plataforma(s) do dia.
- `lifecycle/route.ts`: aplica retenção (arquiva/expira) e limpa `raw_signals` processados.

**Revisão (admin):** lista edições `draft`; aprovar/editar/rejeitar por item ou edição. Aprovar → `published`, `publish_date`, dispara e-mail digest. Rejeitar → motivo registrado (feedback para ajuste de prompt).

---

## 6. Ingestão — fontes legais

Configuráveis em `ingestion_sources` (`type`: `api` | `rss` | `trends` | `manual_seed`):
- APIs/feeds autorizados, Google Trends, APIs de notícias, newsletters via RSS.
- **Seed mínimo opcional**: campo no admin para colar 2–3 links/temas que a IA expande.
- Banco evergreen (prompts/padrões atemporais) reduz a dependência de sinal diário.
- **Proibido:** scraping de redes sociais / captura automática da aba Explorar.

---

## 7. Controle de sessão (limite de dispositivos)

- N dispositivos ativos (sugestão 2, configurável).
- Login no N+1 revoga o mais antigo (`is_active=false`, `revoked_at`).
- Combina `device_id` + `user_agent` + `last_seen_at` + `session_token_hash`.
- Cada login/revogação → `access_logs`.

---

## 8. Rate limiting

Estrutura preparada (Upstash Redis futuro). Ações: login, cadastro, recuperação de senha, criação de convites (futuro), **geração sob demanda por usuário** (Trend Translator/adaptações no MVP 2), endpoints de cron (via `CRON_SECRET`).

---

## 9. Auditoria

`audit_logs` registra: login, logout, criação/edição/publicação/rejeição de conteúdo editorial, arquivamento, login em novo dispositivo, revogação de sessão. (Membros/permissões/plano: futuro.)

---

## 10. Billing (preparado, sem Stripe)

`plans` com **uma linha** (mensal + anual com desconto = mesmo acesso). `subscriptions` com `subscription_status`. No MVP, acesso pode ser concedido manualmente; Stripe entra no MVP 3 com validação de webhook.

---

## 11. Uploads (futuro)

Não implementar agora. Quando entrar: validar extensão e MIME, limitar tamanho, Supabase Storage/R2, buckets privados com URLs assinadas, nunca executar arquivos.
