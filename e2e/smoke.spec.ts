import { test, expect } from "@playwright/test";

/**
 * Smoke test estático: prova que o encanamento do Playwright funciona
 * (runner → browser → asserções) contra uma rota pública, sem depender de
 * nenhuma credencial ou serviço externo (Supabase/GoTrue). Distinto do fluxo
 * de login em login-flow.spec.ts, que precisa de auth real.
 */
test("landing page carrega e renderiza conteúdo estático esperado", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page).toHaveTitle(/Kabrito/);
  // Duas ocorrências na landing (nav + hero) — só confere que pelo menos uma
  // está visível, sem acoplar o teste a qual delas é "a" primeira.
  await expect(
    page.getByRole("link", { name: "Entrar" }).first(),
  ).toBeVisible();
});
