# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
O projeto ainda não usa tags de versão semântica (deploy contínuo direto de
`main`) — as entradas abaixo agrupam os PRs mergeados por data e por lote
temático, mais recente primeiro. Cada item descreve o efeito para quem usa ou
mantém o projeto, não o diff técnico; o número entre parênteses referencia o PR
correspondente (`gh pr view <número>`).

## 2026-07-13 — Acessibilidade (A11Y)

### Added

- Navegação principal ganhou `aria-current` na página ativa e passou a ser
  totalmente operável por teclado (#111).
- Ícones usados como único conteúdo de um botão (ações de tabela, etc.) ganharam
  `aria-label` descritivo; fotos de perfil ganharam texto alternativo (#110).

### Fixed

- `ConfirmDialog` prende o foco dentro do próprio diálogo enquanto aberto e
  devolve o foco a quem o abriu ao fechar — antes o Tab podia escapar para trás
  do overlay (#108).
- Campos de formulário passaram a ter `<label>` associado corretamente e erros
  de validação são anunciados via `role="alert"`; ordem de tabulação auditada
  nas telas principais (#109).
- Contraste de `text-muted-foreground` elevado ao mínimo AA; animações da
  interface respeitam `prefers-reduced-motion` do sistema operacional (#112).

## 2026-07-12 — UI, UX e performance

### Added

- Fila de revisão do admin e lista de membros da equipe ganharam busca
  client-side (#99).
- Breadcrumbs no admin e em settings/equipe (#97).
- Link de suporte na tela de recuperação de MFA, para quem perdeu o
  autenticador (#98).
- Onboarding vira checklist de 2 passos (2FA + avatar) em vez de um único CTA
  (#94).
- Preferência de tema (claro/escuro) passa a persistir no perfil entre sessões,
  em vez de resetar a cada login (#93).
- Rejeição de item no admin/review agora pode ser desfeita; salvamento passou a
  ser por campo em vez de formulário inteiro (#96).
- Mensagens de erro acionáveis nos pontos que ainda mostravam erro genérico,
  dentro e fora do admin (#96, #100).
- Tabelas do admin viram lista de cards no mobile; empty states ganharam ícone
  contextual (#90, #91).
- Foco visível consistente e micro-transições compartilhadas entre componentes
  (#89).

### Changed

- Leituras globais de edições/`dashboard_cards` passaram a ser cacheadas
  (opt-in, 5 min) — menos carga no banco sem risco de mostrar rascunho não
  publicado (ver `docs/adr/0003-cache-opt-in-em-getEditionWithModules.md`)
  (#107).
- Daily-briefing e analytics fazem streaming progressivo com Suspense em vez de
  esperar todos os dados de uma vez (#105).
- Server Actions com múltiplas leituras independentes passaram a paralelizar os
  `await`s (#106).
- Landing e páginas legais passaram a usar ISR; GSAP virou import dinâmico,
  reduzindo o JS inicial da landing (#103).
- Índices adicionados nas colunas mais consultadas (`edition_date`,
  `organization_id`, `user_id`) (#101).
- Fronteiras de Server/Client Component reauditadas; componentes-folha client
  extraídos para reduzir o que precisa hidratar no navegador (#102).
- Erros de rate-limit mostram o tempo real de espera; reenvio de confirmação de
  e-mail mostra contador (#95).
- Escala única de spacing/tipografia aplicada em todo o dashboard; cards do
  dashboard padronizados (#87, #88).
- Contraste dos tokens `dark:` corrigido para AA (#92).
- Dependências atualizadas: `lucide-react`, `actions/checkout`, e o grupo de
  dependências de desenvolvimento/minor do npm (#15, #16, #54, #85).

## 2026-07-11 — UI, refatoração interna e SEO

### Added

- Cada rota passou a ter `loading.tsx`/skeleton próprio em vez de tela em
  branco durante a navegação (#74).
- Dados estruturados JSON-LD (Organization, SoftwareApplication, FAQPage) na
  landing, para rich results de busca (#77).

### Changed

- `<img>` trocado por `next/image` em todo o app (otimização e lazy loading
  automáticos) (#73).
- Badge de status consolidado num componente único, antes duplicado por tela
  (#75).
- Cliente Supabase passou a ser tipado com o `Database` gerado, eliminando
  `any` implícito em queries (#78).
- `admin.ts` e `team.ts` quebrados por domínio; `ActionResult<T>` unificado em
  todas as Server Actions; mensagens de erro e config de cliente centralizadas
  (#80, #83, #84, #86).
- Regra de ESLint (`boundaries`) passou a barrar import de `service_role`/Drizzle
  direto fora de `server/pipeline/`, `server/admin/` e `app/api/cron/`; código
  morto removido (ver `docs/adr/0001-rls-como-camada-primaria-de-acesso.md`)
  (#82).
- `app/page.tsx` (landing) extraído em seções menores (#81).

### Documentation

- `README.md`, `ARCHITECTURE.md` e `CONTRIBUTING.md` reescritos para refletir o
  código real, em vez do documento de design original (#76).

## 2026-07-09 — Segurança (hardening SEC-1 a SEC-9) e qualidade de CI

### Security

- Backstop de AAL2 (segundo fator) passou a ser exigido diretamente nas Server
  Actions sensíveis (equipe, exclusão de conta, aprovação de edição), não só na
  navegação (#70).
- Bloqueio progressivo de login após falhas repetidas — 8 tentativas em 15min
  por e-mail (#71).
- Troca de senha agora revoga as demais sessões ativas (#67).
- Recovery codes de MFA (10 códigos de uso único): quem perde o autenticador
  não depende mais do CLI admin para recuperar acesso (#72).
- Rate-limit adicionado às ações que ainda não tinham; teto de tamanho em todo
  campo de texto livre (#68).
- Headers cross-origin (COOP/CORP) adicionados; Trusted Types habilitado em
  modo Report-Only (#69).
- Corrigida vulnerabilidade de SQL injection no `drizzle-orm`
  (GHSA-gpj5-g38j-94v9, severidade alta) (#65).

### Changed

- CI passou a rodar `jsx-a11y` e a regra anti-`dangerouslySetInnerHTML` no
  lint; Husky + lint-staged + verificação de Prettier adicionados ao pipeline
  (#58, #60).
- Código inteiro formatado com Prettier, sem mudança de lógica (#59).
- `npm audit` e `knip` (código morto) passaram a rodar no CI como sinais
  não-bloqueantes (#61).
- 7 dependências de produção sem uso removidas (#64).

## 2026-06-28 — Segurança e privacidade (LGPD)

### Security

- Corrigida escalada de privilégio admin→owner (guard de aplicação + RLS)
  (#45).
- Rate-limit em TOTP e anti-enumeração no cadastro reforçados (#46).
- Conectores de ingestão passaram a revalidar redirects, prevenindo SSRF (#47).
- Validação de subchunk WEBP no sniff de upload de avatar (#53).
- Webhook do Stripe ganhou idempotência e proteção anti-replay (#52).
- Permissões mínimas nos workflows de CI; Actions fixadas por SHA; checksum
  verificado do gitleaks (#50).

### Added

- Exclusão de conta agora remove os dados por completo, incluindo expurgo de
  sessões e convites pendentes (LGPD) (#48).
- Exportação de dados pessoais (LGPD Art. 18) e lista de sub-processadores
  publicada (#51).

## 2026-06-27 — Isolamento multi-tenant e publicação atômica

### Security

- Testes de RLS para negação de escrita cross-organização (#36).
- `team.ts` passou a revalidar o papel do ator na organização internamente —
  backstop contra IDOR mesmo que o gate da Server Action falhe (#38).
- Webhook do Stripe valida o `organizationId` (formato e existência) antes de
  gravar a assinatura (#37).
- Reset de MFA por admin; teste de guarda nas rotas de cron/webhook (#42).

### Added

- Publicação de edição passou a ser atômica via RPC (`approve_edition`), com
  fallback seguro se a RPC falhar (#44).
- Status de publicação visível na UI; textos de erro menos técnicos (#41).
- Script de backup manual do Postgres (`db:backup`) como mitigação sem custo
  antes de haver PITR (#43).

### Documentation

- `SECURITY.md` criado, documentando o modelo de isolamento de tenant e a
  dívida latente conhecida (ver também
  `docs/adr/0002-conteudo-editorial-global-sem-organization-id.md`) (#40).

## 2026-06-23 — MFA e rate-limit distribuído

### Added

- 2FA (TOTP) disponível como opt-in, com enforcement atrás de feature flag
  (#26).
- Cadastro bloqueia senhas vazadas, verificando contra o HaveIBeenPwned (#27).
- Enforcement de MFA ligado em produção (#28).
- Rate-limit distribuído via Upstash Redis, com fallback em memória por
  instância se o Redis cair (#29, #31).
- "Sair de todos os dispositivos" (#25).
- 7 melhorias de alto impacto de UX (Lote 3) e robustez de erro/404 e
  onboarding (Lote 4) (#23, #24).

## 2026-06-22 — SEO, LGPD e UI

### Added

- Metadados de SEO e social-share: Open Graph, sitemap, robots.txt, favicon
  (#21).
- Aviso de cookies essenciais (LGPD) (#22).
- 8 ajustes de acionabilidade de UI (Lote 1) (#20).

## 2026-06-16 — Lançamento: CSP, auditoria e CI

### Security

- CSP com nonce por requisição e `strict-dynamic`, promovida a modo enforcing
  (#6, #8).
- Trilha de auditoria de mudanças de privilégio (#9).
- Convite por token vinculado ao e-mail do destinatário, corrigindo um caminho
  de sequestro de convite (#10).
- Hardening de XSS em e-mail, SSRF, open-redirect, cookies e upload (#4).

### Added

- CI: workflow de gate (typecheck/lint/RLS) + gitleaks; Dependabot configurado
  (#11, #12).
- Seções de conversão com animações GSAP no scroll na landing (#1).

## 2026-06-14 — MVP inicial

### Added

- Primeira versão da plataforma: pipeline de geração de conteúdo (ingest →
  generate → draft → revisão humana → publish), autenticação via Supabase,
  dashboard e área administrativa.
