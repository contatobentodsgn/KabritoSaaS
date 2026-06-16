import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
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
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
    pool: "forks",
    fileParallelism: false,
  },
});
