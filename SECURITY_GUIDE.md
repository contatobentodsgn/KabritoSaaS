# SECURITY_GUIDE.md

Guia de segurança do SaaS de Inteligência Criativa. Cobre os riscos evitados, como testar cada camada e o checklist obrigatório antes de produção. Leia junto com o `PROJECT_MASTER_DOCUMENT_v2.md`.

---

## 1. Principais riscos evitados

| Risco | Defesa |
|---|---|
| Vazamento de dados entre usuários | RLS por domínio + queries de usuário sempre via cliente Supabase (com JWT) |
| Acesso de uma conta a dados de outra (IDOR) | Backend deriva `user_id`/`organization_id` do contexto autenticado, nunca do input |
| Conteúdo pago acessado sem assinatura | RLS de leitura exige assinatura ativa + conteúdo publicado e não expirado |
| Permissão só no frontend | Toda autorização validada no servidor (helpers de permissão) |
| Segredos expostos no client | Segredos só em código de servidor; nunca importados em componente client |
| RLS "decorativa" | Regra dura sobre uso da `service_role` (seção 3) |
| Cron disparado por qualquer um | Endpoints de cron protegidos por `CRON_SECRET` |
| Custo de IA descontrolado | Teto por run + log de tokens/custo |
| Compartilhamento de conta | Limite de dispositivos ativos |
| Dados pessoais sem base legal (LGPD) | Política, base legal, exclusão de conta, retenção de logs |

---

## 2. Como evitar vazamento de dados

1. **Todo dado de usuário tem `user_id`** (e `organization_id` quando aplicável).
2. **Queries de usuário final passam pelo cliente Supabase autenticado.** A RLS então é aplicada automaticamente com `auth.uid()`.
3. **Conteúdo editorial é global e somente-leitura para o usuário.** A autorização é "assinatura ativa + publicado + não expirado" — não há `organization_id` nessas tabelas.
4. **Nunca selecionar `*` cegamente** em endpoints que retornam dados sensíveis; selecione campos explícitos.
5. **Logs e mensagens de erro nunca expõem dados de outro usuário** nem segredos.

---

## 3. A regra crítica: Drizzle × RLS

> Esta é a defesa que sustenta todas as outras. Se for violada, a RLS vira decoração.

A RLS do Postgres **só é aplicada** quando a conexão roda no contexto do usuário (cliente Supabase com o JWT). Conexões via `DATABASE_URL` direta ou via `SUPABASE_SERVICE_ROLE_KEY` rodam como dono do banco e **ignoram a RLS**.

**Regra dura:**

- `SUPABASE_SERVICE_ROLE_KEY` e a connection direta do Drizzle são usadas **apenas** em:
  - pipeline de geração;
  - rotinas de cron;
  - rotinas administrativas internas.
- **Nunca** em queries originadas por requisição de usuário final.
- Queries de usuário final → **sempre** cliente Supabase com o JWT do usuário, para que a RLS seja a rede de segurança real.

**Como impor isso no código:**
- Dois clientes separados e nomeados: `getUserDbClient()` (Supabase, JWT) e `getServiceDbClient()` (service_role, isolado em `server/pipeline/` e `server/admin/`).
- Lint/code review: proibir import de `getServiceDbClient` fora dessas pastas.
- Nenhum componente client importa qualquer cliente de banco.

---

## 4. Como evitar IDOR

IDOR = trocar um ID na URL/API para acessar dado alheio.

1. **Nunca confie em `organization_id`/`user_id` vindo do frontend.** Derive sempre do contexto autenticado:
   ```ts
   // ERRADO
   const orgId = input.organizationId;
   // CERTO
   const orgId = (await getCurrentOrganization()).id;
   ```
2. **Toda leitura/escrita de recurso valida posse** no backend (`canReadEdition`, `requireOrganizationAccess`, etc.) **além** da RLS.
3. **Favoritos, sessões e logs** filtram por `user_id = auth.uid()` na própria policy.
4. **Defesa em profundidade:** mesmo que o helper de permissão falhe, a RLS bloqueia (desde que a query passe pelo cliente de usuário).

---

## 5. Como proteger segredos

- Segredos (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CRON_SECRET`, `AI_API_KEY`, `STRIPE_SECRET_KEY`, etc.) **só em variáveis de ambiente de servidor**.
- Apenas `NEXT_PUBLIC_*` pode ir ao client.
- **Verificação automática:** um teste/lint que falha o build se um segredo for importado em arquivo marcado `"use client"`.
- `.env` nunca versionado; manter apenas `.env.example`.
- Rotacionar chaves se houver suspeita de vazamento; `service_role` jamais em logs.

---

## 6. Como testar a RLS

Crie um conjunto de testes que rode contra um banco de teste com policies aplicadas. O teste mais importante prova a própria premissa da seção 3.

### 6.1 Teste-âncora: service_role ignora RLS, cliente respeita
```
Dado: usuário A (org A) e usuário B (org B), cada um com 1 favorito.
1. Cliente Supabase autenticado como A → SELECT em user_favorites
   ESPERADO: vê só o favorito de A. (RLS aplicada)
2. Mesma query como B → vê só o de B.
3. Conexão service_role → SELECT em user_favorites
   ESPERADO: vê os dois. (RLS ignorada — comprova por que service_role
   só pode rodar em código isolado.)
```
Se o passo 1 retornar o favorito de B, a RLS está quebrada — bloqueie o deploy.

### 6.2 Conteúdo editorial: assinatura controla leitura
```
Dado: edição publicada e não expirada.
1. Usuário com assinatura ATIVA → vê a edição e seus itens.
2. Usuário SEM assinatura ativa → NÃO vê nada do conteúdo editorial.
3. Edição em status 'draft' → nenhum usuário final vê (só staff).
4. Edição com content_expires_at no passado → não aparece para ninguém.
```

### 6.3 Isolamento de dados de usuário
```
1. A tenta ler favoritos/sessões de B (via id direto) → bloqueado.
2. A tenta ler membros/assinatura da org de B → bloqueado.
```

### 6.4 Escrita restrita
```
1. Usuário final tenta INSERT/UPDATE em content_editions → bloqueado.
2. Usuário final tenta acessar raw_signals/generation_runs → bloqueado.
3. Apenas role de staff (editor/superadmin) escreve conteúdo editorial.
```

### Esqueleto de policy (referência)
```sql
-- Leitura de edição: assinatura ativa + publicada + não expirada
create policy "read_published_editions"
on content_editions for select
using (
  status = 'published'
  and (content_expires_at is null or content_expires_at > now())
  and exists (
    select 1 from subscriptions s
    join organization_members m on m.organization_id = s.organization_id
    where m.user_id = auth.uid()
      and s.subscription_status = 'active'
  )
);

-- Favoritos: só os próprios
create policy "own_favorites"
on user_favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

---

## 7. Como testar permissões (camada de aplicação)

Além da RLS, teste os helpers de permissão:

- `requireAuth()` → bloqueia anônimo.
- `requireActiveSubscription()` → bloqueia assinatura inativa/expirada.
- `requireStaff()` / `requireEditor()` → bloqueiam usuário comum no admin e na fila de revisão.
- `canReviewContent()` → só staff aprova/edita/rejeita.
- `canManagePipeline()` → só superadmin configura fontes/custos.
- **Teste negativo para cada ação sensível:** o caminho "não autorizado" deve falhar com 403, não com 500 nem com sucesso silencioso.

---

## 8. Como testar o controle de sessão

```
Limite de dispositivos = N (ex.: 2).
1. Login em 2 dispositivos → ambos ativos.
2. Login no 3º → o mais antigo é revogado (is_active=false, revoked_at).
3. Dispositivo revogado tenta navegar → recebe "sessão expirada" e precisa relogar.
4. Cada login/revogação gera linha em access_logs.
5. device_id ausente/forjado não burla o limite (validar no servidor).
```

---

## 9. Segurança do pipeline e do cron

- Endpoints `/api/cron/*` exigem header com `CRON_SECRET`; rejeitar (401) sem ele.
- Pipeline roda com `service_role` **isolado** (seção 3).
- Saída da IA **sempre** validada por Zod (`generation-schemas.ts`); saída inválida nunca é gravada.
- Teto de custo/tokens por `generation_run`; ultrapassou → para e alerta (Sentry).
- Falha em qualquer estágio **não publica** — conteúdo só vai ao ar após aprovação humana.
- Idempotência por `(platform_id, edition_date)`.

---

## 10. LGPD

- **Base legal e consentimento** registrados; política de privacidade publicada.
- **Direito de exclusão:** fluxo de exclusão de conta que apaga/anonimiza dados pessoais (`deleted_at`), preservando o mínimo legal.
- **Retenção:** logs e `raw_signals` com janela definida e limpeza automática.
- **Minimização:** coletar só o necessário; `ip_address`/`user_agent` apenas para segurança/auditoria, com retenção limitada.
- **Acesso/portabilidade:** prever exportação dos dados do usuário quando solicitado.

---

## 11. Checklist antes de produção

**Banco e RLS**
- [ ] RLS habilitada em **todas** as tabelas sensíveis.
- [ ] Teste-âncora (6.1) passa: cliente respeita RLS, service_role ignora.
- [ ] Testes 6.2–6.4 passam (assinatura, isolamento, escrita restrita).
- [ ] Nenhuma policy permite leitura ampla por engano (revisar cada `using`).

**Conexões e segredos**
- [ ] `service_role`/Drizzle direto só em `server/pipeline`, `server/admin`, cron.
- [ ] Lint bloqueia import de cliente de serviço fora dessas pastas.
- [ ] Nenhum segredo importado em arquivo `"use client"`.
- [ ] `.env` fora do versionamento; `.env.example` atualizado.

**Autorização**
- [ ] Toda ação sensível tem teste negativo (403 no caminho não autorizado).
- [ ] `organization_id`/`user_id` nunca vêm do frontend como fonte de verdade.
- [ ] Helpers de permissão cobrem leitura, escrita, admin e billing.

**Pipeline / cron**
- [ ] `/api/cron/*` rejeita requisição sem `CRON_SECRET`.
- [ ] Saída da IA validada por Zod; inválida não é gravada.
- [ ] Teto de custo/tokens ativo; falha não publica.

**Sessão**
- [ ] Limite de dispositivos funciona e gera `access_logs`.
- [ ] Sessão revogada não consegue navegar.

**LGPD / dados**
- [ ] Política de privacidade publicada.
- [ ] Fluxo de exclusão de conta funcional.
- [ ] Retenção automática de logs e conteúdo aplicada.

**Operacional**
- [ ] Sentry capturando erros de servidor e do pipeline.
- [ ] Alertas de falha do pipeline chegam à equipe.
- [ ] Backup do banco configurado.
- [ ] Rate limiting ativo em login/cadastro/recuperação e geração sob demanda.

---

## 12. Estado de implementação (espelhado ao código)

Esta seção foi adicionada na Fase 9. O checklist da §11 foi executado e está
preenchido com evidências em **`SECURITY_CHECKLIST.md`**.

Mapa rápido código ↔ defesa:
- **Regra Drizzle × RLS (§3):** `server/db/service-client.ts` (isolado, `server-only`)
  vs `lib/supabase/server.ts` (JWT). Isolamento imposto por `eslint.config.mjs`
  (bloqueia o import fora de `server/pipeline|admin` e `app/api/cron`) — verificado.
- **RLS por domínio (§6):** `db/migrations/0001_rls.sql` (24 tabelas, 41 policies,
  helpers `has_active_subscription`/`is_staff`/`is_edition_published`).
- **Testes de RLS (§6.1–6.4):** `tests/rls/rls.test.ts` (17/17). O harness
  (`tests/rls/bootstrap.local.sql`) emula o Supabase (roles + `auth.uid()`) para
  rodar contra Postgres comum.
- **Cron protegido (§9):** `server/pipeline/cron.ts` (`isCronAuthorized`) +
  rotas `app/api/cron/*` — verificado 401 sem segredo.
- **Pipeline (§9):** `server/pipeline/run.ts` — Zod por módulo, teto de custo,
  idempotência, falha não publica (`tests/manual/verify-pipeline.ts`).
- **Sessão (§8):** `server/services/session.ts` + `tests/unit/device-limit.test.ts`.
- **Segredos no client (§5):** `server/env.ts` (`server-only`) + regra ESLint
  `no-secrets-in-client`.
- **LGPD (§10):** `/privacy`, `server/actions/account.ts` (exclusão), retenção em
  `server/pipeline/lifecycle.ts`.
