#!/usr/bin/env node
/**
 * DX-10: `npm run help` — lista categorizada dos scripts do package.json com
 * descrição de uma linha cada. Mesma história do README.md (seção "## Scripts")
 * em texto puro no terminal; sem dependência nova, só console.log formatado.
 */

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const SECTIONS = [
  {
    title: "Dev / build",
    scripts: [
      ["dev", "servidor local (next dev)"],
      ["build", "build de produção"],
      ["start", "serve o build"],
    ],
  },
  {
    title: "Qualidade (mesmos comandos do CI)",
    scripts: [
      ["typecheck", "tsc --noEmit"],
      [
        "lint",
        "ESLint (inclui jsx-a11y + regras locais de segredo/dangerouslySetInnerHTML)",
      ],
      ["format", "Prettier --write no repo inteiro"],
      [
        "format:check",
        "Prettier --check (o pre-commit já roda --write via lint-staged)",
      ],
      [
        "audit:deps",
        "npm audit, deps de produção, high+ (sinal não-bloqueante no CI)",
      ],
      [
        "deadcode",
        "knip — exports/arquivos/deps sem uso (sinal não-bloqueante no CI)",
      ],
    ],
  },
  {
    title: "Banco de dados",
    scripts: [
      ["db:generate", "gera migration a partir de db/schema.ts (Drizzle Kit)"],
      [
        "db:gen-types",
        "gera types TS do schema do Supabase (types/supabase.ts)",
      ],
      ["db:migrate", "aplica migrations pendentes"],
      [
        "db:seed",
        "plano único + plataformas + nichos + tags + prompt + fontes + dados de demo",
      ],
      ["seed:editions", "edições de exemplo via pipeline real (dev/demo)"],
      ["seed:test-user", "usuário de teste (dev)"],
      ["setup:storage", "cria os buckets do Supabase Storage (avatares)"],
      ["db:backup", "dump do banco"],
    ],
  },
  {
    title:
      "Verificação de integrações externas (lê .env.local, não altera nada)",
    scripts: [
      ["check:supabase", "conectividade + schema"],
      ["check:upstash", "rate-limit distribuído (Redis)"],
      ["check:resend", "envio de e-mail"],
    ],
  },
  {
    title: "Testes",
    scripts: [
      ["test", "vitest: unit (device-limit, rate-limit, MFA lockout...)"],
      [
        "test:rls",
        "vitest: RLS contra Postgres local (precisa de scripts/setup-local-db.sh rodando)",
      ],
    ],
  },
  {
    title: "Operação / CLI admin (produção — usam SUPABASE_SERVICE_ROLE_KEY)",
    scripts: [
      [
        "pipeline:run",
        "roda o pipeline de geração manualmente (-- <plataforma>)",
      ],
      ["grant", "concede acesso manualmente, sem Stripe (-- <email> <dias>)"],
      ["staff", "promove/rebaixa staff, editor/superadmin (-- <email> <role>)"],
      ["mfa:reset", "remove 2FA de uma conta (-- <email>)"],
    ],
  },
  {
    title: "Meta",
    scripts: [["help", "esta lista"]],
  },
];

const widest = Math.max(
  ...SECTIONS.flatMap((s) => s.scripts.map(([name]) => name.length)),
);

console.log(`\n${BOLD}Scripts disponíveis (npm run <script>)${RESET}\n`);
for (const section of SECTIONS) {
  console.log(`${BOLD}${section.title}${RESET}`);
  for (const [name, description] of section.scripts) {
    console.log(`  ${name.padEnd(widest + 2)}${DIM}${description}${RESET}`);
  }
  console.log("");
}
console.log(`${DIM}Detalhes: README.md → "## Scripts"${RESET}\n`);
