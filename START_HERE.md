# START HERE — Instruções para o Claude Code

Este pacote contém toda a especificação de um SaaS de **inteligência criativa para criadores de conteúdo e social media**, com produção **automatizada por pipeline de IA + revisão humana**. Use estes arquivos como fonte da verdade.

## Como usar este pacote (ordem de leitura)

1. `PROJECT_MASTER_DOCUMENT.md` — visão, modelo operacional automatizado, modelo de dados (4 domínios), plano único.
2. `TECHNICAL_SPEC.md` — estrutura de pastas, configuração de stack, RLS, pipeline, cron, sessão, rate limiting.
3. `db/schema.ts` — schema Drizzle de referência (os 4 domínios).
4. `pipeline/generation-schemas.ts` — schemas Zod da saída da IA por módulo.
5. `pipeline/generator-prompts.md` — prompts (system + user) de cada gerador.
6. `SECURITY_GUIDE.md` — testes de RLS e checklist de produção.
7. `ROADMAP.md` — fases MVP 1/2/3 com critérios de aceite.
8. `.env.example` — variáveis de ambiente.

## Antes de escrever qualquer código, produza:

1. **Plano técnico resumido.**
2. **Árvore de arquivos** que você vai criar (baseada em `TECHNICAL_SPEC.md`).
3. **Riscos que está prevenindo** e como.
4. **Ordem de implementação** (use a de `ROADMAP.md` como base).

Só depois implemente, **etapa por etapa**, parando para revisão de segurança antes de avançar.

## Restrições inegociáveis

- **Plano único.** Sem tiers, sem `is_premium`, sem gating por nível. Acesso = assinatura ativa.
- **Automação-first.** A IA gera; a pessoa só **revisa/aprova**. Falha no pipeline **nunca publica**.
- **Regra Drizzle × RLS.** `SUPABASE_SERVICE_ROLE_KEY` e conexão direta do Drizzle **só** em pipeline/cron/admin. Queries de usuário final **sempre** via cliente Supabase com JWT, para a RLS valer. Ver `SECURITY_GUIDE.md` §3.
- **Conteúdo editorial é global** (sem `organization_id`). Só dados de usuário são escopados.
- **Sem scraping de redes sociais.** Ingestão só de fontes autorizadas (`TECHNICAL_SPEC.md` §Pipeline).
- **Multi-tenant latente.** A `organization` existe no banco mas é **invisível na UX do MVP** (criada automática no cadastro, sem seletor, sem gestão de membros).
- **Toda entrada validada com Zod. Nada secreto em componente client.**

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase Auth · PostgreSQL + RLS · Drizzle ORM · Zod · Vercel (deploy + cron) · Resend/Brevo (e-mail) · Sentry · Stripe (preparado, **não implementar agora**).

## Entrega esperada da V1

Auth + dashboard + edição diária (Instagram) + módulos de conteúdo + favoritos + fila de revisão (admin) + pipeline de geração com saída validada por Zod + e-mail digest + retenção única + controle de sessão por dispositivos + RLS por domínio + helpers de permissão + auditoria + `.env.example` + os dois documentos (`PROJECT_MASTER_DOCUMENT.md`, `SECURITY_GUIDE.md`). Billing preparado **sem** Stripe.
