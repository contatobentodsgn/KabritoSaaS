# DEPLOY.md — Produção na Vercel

Guia ordenado para subir o SaaS na Vercel com Supabase. Baseado em auditoria de
deploy-readiness do código real (envs, runtime/edge, auth da Supabase, crons).

> **Estado do código:** pronto para deploy. `next build` passa; runtime Node
> travado nas crons e no callback; headers de segurança no `next.config.mjs`;
> sem `next/image` (não precisa `remotePatterns`). O que falta é **configuração
> de contas** (Vercel + Supabase) — os passos abaixo.

Antes de tudo, confirme o gate local (são os mesmos checks que a Vercel roda no build):

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

---

## 1. Pré-requisito: migração 0009 na Supabase

Ainda pendente da Fase 9 (hardening de LGPD). Seguro e idempotente:

```bash
npm run db:migrate   # usa a DATABASE_URL do .env.local (Supabase); só a 0009 roda
```

---

## 2. Variáveis de ambiente na Vercel

Project Settings → **Environment Variables** (escopo **Production**, e Preview se
for testar lá). Marque os segredos como **Sensitive**.

### Obrigatórias (sem elas o app/crons não funcionam)

| Variável | Tipo | Valor / origem |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | Supabase → Settings → API → Project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | Supabase → Settings → API → **publishable/anon** key (NÃO a secret) |
| `NEXT_PUBLIC_APP_URL` | pública | domínio HTTPS de produção, **sem barra final** (ex.: `https://app.kabritodigital.com`) |
| `DATABASE_URL` | **segredo** | Supabase → Settings → Database → connection string. Use o **pooler** (porta 6543) para serverless |
| `SUPABASE_SERVICE_ROLE_KEY` | **segredo** | Supabase → Settings → API → **secret** key (bypassa RLS — nunca pública) |
| `CRON_SECRET` | **segredo** | gere forte: `openssl rand -hex 32`. A Vercel injeta como `Bearer` nas crons |
| `AI_API_KEY` | **segredo** | Anthropic (`sk-ant-...`). **Sem ela o pipeline usa mock e não gera conteúdo real** |

> ⚠️ `NEXT_PUBLIC_APP_URL` no default (`localhost:3000`) **quebra silenciosamente**
> links de convite/digest (e-mail) e as success/cancel URLs do Stripe. Sempre
> setar o domínio real.

### Opcionais (têm default no código)

| Variável | Default | Quando setar |
|---|---|---|
| `RESEND_API_KEY` | — | **necessária para e-mails** (convite/digest); sem ela o envio é pulado |
| `EMAIL_FROM` | `Inteligência Criativa <digest@example.com>` | remetente verificado no Resend |
| `AI_MODEL` | `claude-3-5-sonnet-latest` | trocar o modelo |
| `AI_RUN_COST_CAP_USD` | `2.00` | teto de custo por run |
| `AI_RUN_TOKEN_CAP` | `200000` | teto de tokens por run |
| `DEVICE_LIMIT` | `2` | dispositivos ativos por usuário |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` | vazio = billing OFF | ativar Stripe real |

> `SENTRY_DSN` está documentado mas **não tem consumidor no código** (Sentry ainda
> não foi instrumentado). Não precisa setar agora.

---

## 3. Configuração de Auth na Supabase (produção)

Authentication → **URL Configuration**:

- **Site URL** = `https://SEU-DOMINIO` (mesma do `NEXT_PUBLIC_APP_URL`). É a base
  dos links dos e-mails de confirmação/recuperação (o código não passa
  `emailRedirectTo`, então isso depende 100% da Site URL).
- **Redirect URLs** — adicionar:
  - `https://SEU-DOMINIO/api/auth/callback`  ← path exato do callback
  - `https://SEU-DOMINIO/**`  ← wildcard (cobre `?redirectTo=` e futuros OAuth)

> Se o redirect **não** estiver allowlistado, a confirmação de e-mail quebra
> (o `code` nunca chega ao app → `/login?error=auth_callback`). Cadastre **antes**
> de habilitar "Confirm email" em produção e teste um signup real.

**Confirm email:** recomendado **ON** em produção (verifica o e-mail; usa o fluxo
de callback acima). Se quiser UX sem fricção, OFF cria sessão direto — o app já
trata os dois casos.

---

## 4. Deploy (Git → Vercel)

O repositório ainda **não tem commit nem remote**. Opção recomendada: GitHub → Vercel.

```bash
# 1) primeiro commit (o .gitignore já protege .env.local)
git add -A
git commit -m "chore: projeto inicial pronto para deploy"

# 2) criar o repo no GitHub e apontar o remote
#    (crie um repo PRIVADO vazio em github.com/new, depois:)
git remote add origin git@github.com:SEU-USUARIO/kabrito-saas.git
git push -u origin main
```

Na Vercel: **Add New → Project → Import** o repo do GitHub. Framework
**Next.js** é detectado automaticamente (build `next build`, sem `output`
customizado). Cole as env vars do passo 2 **antes** do primeiro build. Deploy.

> Alternativa sem GitHub: `npm i -g vercel && vercel` (CLI faz login + cria o
> projeto + deploy a partir do diretório local). As env vars podem ir por
> `vercel env add` ou pelo painel.

---

## 5. Pós-deploy — validação

1. **App sobe / login:** acessar o domínio, criar conta, confirmar e-mail (deve
   voltar autenticado via `/api/auth/callback`), logar.
2. **Crons (CRON_SECRET provisionado):**
   ```bash
   curl -H "x-cron-secret: SEU_CRON_SECRET" https://SEU-DOMINIO/api/cron/lifecycle
   # esperado: {"ok":true,...}  (401 = CRON_SECRET ausente/errado na Vercel)
   ```
   As crons agendadas (06:00 generate-edition, 04:00 lifecycle) aparecem em
   Vercel → **Cron Jobs**. No plano **Hobby** o horário é aproximado e funções
   têm teto de 60s (suficiente hoje; migrar para Pro se crescer o nº de plataformas).
3. **Acesso de assinante:** liberar acesso manual a um usuário —
   `npm run grant -- email@dominio` (ou ativar Stripe).

---

## 6. Itens de operação ainda abertos (não bloqueiam o deploy)

Da Fase 9 (`SECURITY_CHECKLIST.md` §Operacional):

- **Sentry** — instalar/instrumentar `@sentry/nextjs` e setar `SENTRY_DSN`.
- **Alertas de falha do pipeline** — conectar Sentry/e-mail no caminho de falha.
- **Backup/PITR** — habilitar no painel da Supabase.
- **CSP de script** — `next.config.mjs` já tem HSTS/X-Frame-Options/etc.; um CSP
  estrito pode ser adicionado depois (validar contra Supabase Storage/realtime).
