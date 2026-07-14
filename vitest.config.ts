import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Next.js compila JSX via SWC (runtime automático, sem "import React").
  // Vitest usa esbuild — sem isto ele cai no runtime clássico e os novos
  // testes de componente (.tsx) quebram com "React is not defined".
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)).replace(/\/$/, ""),
      // "server-only" é um guard de build; em teste vira no-op (módulo vazio).
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    // Só os testes de componente (tests/component/**) rodam em jsdom — os 97
    // testes existentes (RLS + unit) continuam em "node", sem custo de DOM
    // nem risco de mudança sutil de comportamento.
    environmentMatchGlobs: [["tests/component/**", "jsdom"]],
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
    pool: "forks",
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      // Sinal, não gate: só reporta, nunca falha o build por percentual
      // (IMPROVEMENTS-PLAN.md DX-6). Thresholds ficam de fora de propósito.
    },
  },
});
