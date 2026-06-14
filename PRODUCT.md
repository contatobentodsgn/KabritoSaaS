# PRODUCT.md

register: product

## One-liner
Central diária de inteligência criativa para criadores de conteúdo e social media — a IA gera, a equipe humana só revisa/aprova. (pt-BR)

## What it is
SaaS automação-first: um pipeline gera a edição diária (pautas, copy, visual, headlines, sugestões, prompts), enfileira como draft, e nada vai ao ar sem aprovação humana. Assinantes ativos leem o conteúdo publicado, favoritam e acompanham o histórico dentro da retenção.

## Audience
- **Assinantes** (criadores, social media, profissionais de conteúdo): consomem a edição diária, favoritam, adaptam ao próprio nicho.
- **Staff** (editor/superadmin): fila de revisão, CRUD de fontes/prompts/taxonomia, custos do pipeline.

## Surfaces (design SERVES the product)
- **Marketing/landing** (`app/page.tsx`) — único surface de register *brand* (hero editorial).
- **Auth** — login/cadastro calmos, com a marca.
- **App shell** — sidebar + topbar; dashboard, edição diária, pautas, headlines, prompts, favoritos, configurações.
- **Admin** — fila de revisão (o único passo humano), fontes, prompts/taxonomia, runs/custo.

## Brand
Kabrito — natural · sensível · editorial · elegante. Verde Black Forest carrega autoridade; rosa/blush fazem o trabalho emocional; Mint Cream é a tela. Voz acolhedora, pt-BR, "você", sentence case, **sem emoji**. Ver `DESIGN.md` e `Kabrito Design System/`.

## Non-negotiables (do not regress)
- Plano único (sem tiers). Automação-first (falha não publica). RLS é a rede de segurança. Conteúdo editorial global. Zod em toda entrada. Nada secreto no client. Multi-tenant latente (org invisível na UX).
