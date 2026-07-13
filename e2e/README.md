# E2E (Playwright)

Testes E2E leves, separados do Vitest (`tests/**/*.test.ts`) por convenção de
diretório: `testDir: "./e2e"` em `playwright.config.ts`, o Vitest nunca olha
para esta pasta e vice-versa — os dois runners não colidem.

## O que existe hoje

- `smoke.spec.ts` — carrega `/` (landing) e confere status 200 + título +
  link "Entrar". Não depende de nenhuma credencial nem de Supabase/GoTrue:
  roda em qualquer ambiente onde `npm run dev` sobe.
- `login-flow.spec.ts` — fluxo completo login → dashboard → logout
  (DX-2 do catálogo de melhorias). **Precisa de um usuário de teste real**
  (ver abaixo); sem as credenciais, o teste pula automaticamente com uma
  mensagem clara em vez de falhar ou travar.

## Como rodar

```bash
npx playwright install chromium   # uma vez, baixa o binário do browser
npx playwright test               # roda tudo (smoke sempre; login-flow só com env vars)
npx playwright test e2e/smoke.spec.ts   # só o smoke
```

O `playwright.config.ts` sobe o app sozinho (`webServer: { command: "npm run dev" }`)
antes de rodar os testes, na porta `PORT` (default `3000`) — não precisa deixar
`npm run dev` rodando à parte, mas se já tiver uma instância local no ar em
`localhost:3000`, o Playwright reaproveita ela (`reuseExistingServer` fora de CI).

## Para rodar `login-flow.spec.ts` de verdade

Ele precisa de credenciais reais de um usuário de teste, via env vars:

```bash
E2E_TEST_EMAIL=teste@exemplo.com E2E_TEST_PASSWORD=senha-do-usuario-de-teste npx playwright test
```

Nunca commitar essas credenciais — vêm de secrets de CI, ou de um `.env.local`
que cada dev configura localmente (nunca versionado; ver `.gitignore`).

Isso pressupõe uma instância Supabase de verdade no ar (com GoTrue/Auth API),
porque o login server action (`signInAction` em `server/actions/auth.ts`) chama
`supabase.auth.signInWithPassword` de verdade — não há como fazer login sem um
backend de auth respondendo. Duas formas de ter isso:

1. **Supabase local** (`supabase start`, requer Docker) — este repo já tem uma
   pasta `supabase/` na raiz para isso; não documentamos o conteúdo dela aqui
   de propósito (ver `SETUP_SUPABASE.md`/`README.md` do projeto para o setup
   completo). Depois de subir localmente, crie um usuário de teste (signup
   normal, ou `npm run seed:test-user` se aplicável) e aponte
   `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`
   para a instância local.
2. **Projeto Supabase de staging** — mesma ideia, mas contra um projeto real
   (não produção). As env vars de auth (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc. — ver `.env.example`) precisam estar
   no `.env.local` (dev local) ou nos secrets do runner de CI.

## Limitação conhecida deste PR

Este PR foi construído num worktree isolado, sem `.env.local` e sem nenhum
Supabase (local ou remoto) acessível — só um Postgres puro (sem GoTrue) usado
pelos testes de RLS do Vitest. Isso significa que `login-flow.spec.ts` nunca
rodou de ponta a ponta neste ambiente: só foi possível confirmar que ele
tipa/linta corretamente e que a lógica do fluxo (seletores, URLs esperadas)
bate com o código real de `server/actions/auth.ts` e `app/(dashboard)/layout.tsx`.
Rodar de verdade requer as env vars/secrets acima — ainda não configurados
neste repo.
