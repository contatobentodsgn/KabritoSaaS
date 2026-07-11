import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import noSecretsInClient from "./eslint-rules/no-secrets-in-client.js";
import noRawDanger from "./eslint-rules/no-raw-danger.js";
import noAppImportInServer from "./eslint-rules/no-app-import-in-server.js";

/**
 * Flat config (ESLint 9). A peça de SEGURANÇA é o bloco de isolamento abaixo:
 *
 *  1. `no-restricted-imports` bloqueia o import do service-client (RLS-bypass)
 *     e dos drivers de conexão direta (postgres / drizzle postgres-js) em
 *     QUALQUER arquivo...
 *  2. ...exceto nas pastas ISOLADAS (server/pipeline, server/admin, app/api/cron)
 *     e no próprio service-client + scripts de db, onde o uso é proposital.
 *  3. `local/no-secrets-in-client` proíbe segredos em arquivos "use client".
 *  4. `local/no-raw-danger` bane dangerouslySetInnerHTML fora do allowlist
 *     revisado (IMPROVEMENTS-PLAN.md SEC-5).
 *  5. `local/no-app-import-in-server` proíbe server/** de importar de app/**
 *     (camada de infra não pode depender da camada de apresentação; a
 *     dependência só vai de app → server).
 *
 * `jsx-a11y` (recommended) roda em .jsx/.tsx — acessibilidade (IMPROVEMENTS-PLAN.md A11Y-10).
 *
 * Ver ROADMAP Fase 0 item 5 e SECURITY_GUIDE §3/§5.
 */

const SERVICE_CLIENT_RESTRICTION = {
  paths: [
    {
      name: "@/server/db/service-client",
      message:
        "service-client ignora a RLS. Só pode ser importado em server/pipeline, server/admin ou app/api/cron. Queries de usuário usam @/lib/supabase/server.",
    },
  ],
  patterns: [
    {
      group: ["postgres", "drizzle-orm/postgres-js"],
      message:
        "Conexão direta do Drizzle ignora a RLS. Use só dentro do service-client (isolado em pipeline/admin/cron).",
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "db/migrations/**",
      "next-env.d.ts",
      "**/*.config.*",
      "Kabrito Design System/**", // material de referência da marca (não é nosso código)
      "public/**",
      "scripts/**", // shell + scripts use_figma (rodam fora do app)
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { ...jsxA11y.flatConfigs.recommended, files: ["**/*.{jsx,tsx}"] },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: {
      local: {
        rules: {
          "no-secrets-in-client": noSecretsInClient,
          "no-raw-danger": noRawDanger,
          "no-app-import-in-server": noAppImportInServer,
        },
      },
    },
    rules: {
      "no-restricted-imports": ["error", SERVICE_CLIENT_RESTRICTION],
      "local/no-secrets-in-client": "error",
      "local/no-raw-danger": "error",
      // Ruído desligado para manter o foco nas regras de segurança.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-empty": "off",
    },
  },
  // Pastas ISOLADAS: o service-client / drivers diretos são permitidos aqui.
  {
    files: [
      "server/pipeline/**",
      "server/admin/**",
      "app/api/cron/**",
      "server/db/service-client.ts",
      "db/**",
      "tests/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Camadas: server/** é infraestrutura e não pode importar de app/**
  // (apresentação). Vale para todo server/**, inclusive as pastas isoladas
  // acima — isolamento de service-client é ortogonal a essa regra.
  {
    files: ["server/**"],
    rules: {
      "local/no-app-import-in-server": "error",
    },
  },
);
