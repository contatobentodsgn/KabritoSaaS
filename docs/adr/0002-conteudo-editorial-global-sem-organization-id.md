# ADR-0002: Conteúdo editorial é global (sem `organization_id`), apesar do modelo multi-tenant

## Status

Accepted

## Contexto

O produto já modela `organization` desde o cadastro (criada automaticamente,
`organization_members`, RLS org-scoped em `organizations`/`subscriptions`/
`org_invites`) — mas essa camada é deliberadamente invisível na UX: não há
seletor de organização, nem gestão de múltiplas orgs. O catálogo editorial
(edições, trends, headlines, prompts) é a única coisa que o usuário realmente vê
todo dia. Modelar esse catálogo como org-scoped desde já seria a escolha
"óbvia" num SaaS multi-tenant — mas o plano atual é único (sem tiers), e todo
assinante, de qualquer organização, deveria ver o mesmo conteúdo gerado pelo
pipeline. Adicionar `organization_id` ao domínio editorial sem essa necessidade
real teria custo de complexidade (RLS por org em toda tabela de conteúdo, joins
extras) sem benefício correspondente hoje.

## Decisão

O domínio editorial e o pipeline de ingestão/geração não têm `organization_id` —
são globais por design. O acesso é gated por _assinatura ativa em qualquer
organização_ (`has_active_subscription(auth.uid())`, função usada nas policies de
`db/migrations/0001_rls.sql`), não pela organização do usuário. `organization` em
si existe desde já (multi-tenant "latente") só para não exigir uma migração de
dados dolorosa no dia em que o produto precisar de conteúdo privado por
organização ("agências amanhã").

## Consequências

Hoje o modelo é mais simples de implementar e de raciocinar: uma edição
publicada é visível para qualquer assinante, ponto. A dívida documentada em
`SECURITY.md` é explícita: `user_favorites`, `access_logs` e `audit_logs` já têm
coluna `organization_id`, mas a RLS não a usa (escopo é só por `user_id` ou
staff) — no dia em que houver conteúdo privado por organização, essas policies
e o próprio domínio editorial vão precisar de RLS por org, o que é uma migração
não-trivial (recorte de dado existente, backfill de propriedade). A escolha atual
aceita esse custo futuro para não pagar complexidade multi-tenant que o produto
não usa ainda.
