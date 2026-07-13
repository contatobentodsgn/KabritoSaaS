import { test, expect } from "@playwright/test";

/**
 * DX-2: 1 E2E leve — login → dashboard → logout.
 *
 * Precisa de um usuário real de teste (E2E_TEST_EMAIL/E2E_TEST_PASSWORD) numa
 * instância Supabase de verdade (local `supabase start` ou um projeto de
 * staging) — sem GoTrue rodando não há como autenticar de verdade. Ver
 * e2e/README.md para o setup completo.
 *
 * Sem as env vars, o teste pula (não falha, não trava) — é o comportamento
 * esperado neste worktree, que não tem .env.local nem stack Supabase local.
 */
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("login → dashboard → logout", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "requires E2E_TEST_EMAIL/E2E_TEST_PASSWORD env vars — see e2e/README.md",
  );

  test("autentica, chega no dashboard e desloga", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(EMAIL!);
    await page.getByLabel("Senha").fill(PASSWORD!);
    await page.getByRole("button", { name: "Entrar" }).click();

    // signInAction redireciona para DEFAULT_REDIRECT ("/dashboard") em sucesso.
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);

    // Conteúdo específico do dashboard autenticado (título da página +
    // botão de logout no header, únicos de dentro do layout autenticado).
    await expect(page).toHaveTitle(/Dashboard/);
    const signOutButton = page.getByRole("button", { name: "Sair" });
    await expect(signOutButton).toBeVisible();

    // Logout: form action=signOutAction → signOut() + redirect(LOGIN_ROUTE).
    await signOutButton.click();
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);

    // Confirma estado deslogado: tentar voltar ao dashboard deve ser barrado
    // pelo middleware e devolver para /login (com redirectTo).
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
