# Conectar um Supabase real (≈ 3 minutos) → login funcionando

O app autentica via **Supabase** (Auth + PostgREST com RLS). Sem um Supabase
conectado, **nenhum** email/senha funciona — não há servidor de auth para validar.
Supabase local exige Docker; o caminho mais rápido é o **free tier na nuvem**.

## 1. Criar o projeto

1. Acesse https://supabase.com → **New project**.
2. Defina uma **Database Password** (anote — vai na `DATABASE_URL`).
3. Aguarde o provisionamento (~1 min).

## 2. Pegar as 4 chaves

No painel do projeto:

| Variável (.env.local)           | Onde encontrar                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | **Project Settings → API → Project URL** (`https://<ref>.supabase.co`)                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API → Project API keys → `anon` `public`**                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Project Settings → API → `service_role` `secret`** (segredo!)                                            |
| `DATABASE_URL`                  | **Project Settings → Database → Connection string → URI** (troque `[YOUR-PASSWORD]` pela senha do passo 1) |

> Use a connection string **Session** ou **Direct** para as migrations. O
> service-client já roda com `prepare:false`, então o pooler também funciona.

## 3. Preencher o `.env.local`

Substitua os placeholders pelos valores reais:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # anon public
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service_role secret
DATABASE_URL=postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres
```

## 4. Login imediato em teste (sem confirmar e-mail)

**Authentication → Sign In / Providers → Email** → desligue **"Confirm email"**.
(Opcional: se mantiver ligado, o cadastro envia link; nosso `/api/auth/callback` trata.)

## 5. Aplicar schema + criar o usuário de teste

```bash
npm run db:migrate        # cria 24 tabelas + RLS (0000→0004) no SEU Supabase
npm run db:seed           # plano único, plataforma, nichos, prompt, fonte
npm run seed:test-user    # cria admin@kabrito.test / Kabrito!2026 (confirmado, superadmin, ativo)
npm run dev               # abrir http://localhost:3000 e logar
```

### Credenciais de teste

- **Email:** `admin@kabrito.test`
- **Senha:** `Kabrito!2026`
- superadmin (acessa `/admin`) + assinatura ativa (vê o conteúdo).

Para promover/criar outros:

```bash
npm run staff -- voce@email.com superadmin
npm run grant -- voce@email.com 365
```

## Conferir a RLS no Supabase real (opcional, recomendado)

O teste-âncora roda localmente. No Supabase real, confira em **Table Editor**
que todas as tabelas mostram **RLS enabled** e que as policies de `0001_rls.sql`
estão presentes (Authentication → Policies).
