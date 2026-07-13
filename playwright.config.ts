import { defineConfig, devices } from "@playwright/test";

// Porta não-padrão (não 3000): evita colidir com outros dev servers que
// possam já estar rodando na máquina/CI. Playwright reaproveita um servidor
// já no ar na mesma URL (reuseExistingServer fora de CI) — em 3000 isso pode
// "reaproveitar" por engano um serviço não relacionado.
const PORT = process.env.PORT ?? "3100";
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

/**
 * E2E leve (DX-2): 1 fluxo real (login → dashboard → logout) + 1 smoke test
 * estático, separados do Vitest (tests/**\/*.test.ts) por convenção de
 * diretório — testDir aqui é e2e/, o Vitest nunca olha para essa pasta.
 *
 * Requer credenciais reais (E2E_TEST_EMAIL/E2E_TEST_PASSWORD) para o fluxo de
 * login — ver e2e/README.md. Sem elas, o spec de login pula (test.skip) e só
 * o smoke test roda.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
