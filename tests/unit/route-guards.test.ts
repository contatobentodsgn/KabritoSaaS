import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guarda de regressão (S3): toda rota sob api/cron deve checar o segredo
 * (isCronAuthorized) e toda rota sob api/webhooks deve validar a assinatura
 * (verifyAndConstructEvent). Essas rotas ficam FORA do middleware (matcher as
 * exclui), então a autenticação vive no próprio handler — um handler novo sem
 * o gate seria um endpoint aberto. Este teste falha se isso acontecer.
 */
function routeFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...routeFiles(p));
    else if (entry.name === "route.ts" || entry.name === "route.tsx") out.push(p);
  }
  return out;
}

const root = process.cwd();
const cronDir = join(root, "app/api/cron");
const webhookDir = join(root, "app/api/webhooks");

describe("S3 — rotas cron/webhook exigem segredo no handler", () => {
  it("todo handler em api/cron chama isCronAuthorized", () => {
    const files = routeFiles(cronDir);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src.includes("isCronAuthorized"), `${f} deve chamar isCronAuthorized`).toBe(true);
    }
  });

  it("todo handler em api/webhooks valida a assinatura (verifyAndConstructEvent)", () => {
    const files = routeFiles(webhookDir);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(
        src.includes("verifyAndConstructEvent"),
        `${f} deve validar a assinatura do webhook`,
      ).toBe(true);
    }
  });
});
