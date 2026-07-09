import { randomUUID } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  recordFailedLogin,
  isLoginLockedOut,
} from "@/server/admin/audit-system";

/**
 * SEC-4 — bloqueio progressivo por conta. Testa a query JSONB de verdade
 * (accessLogs.metadata ->> 'email') contra Postgres real, não só tipos —
 * é a única forma de pegar um erro de sintaxe SQL nesta função (o try/catch
 * de isLoginLockedOut é fail-open: um erro de sintaxe silenciosamente
 * "funcionaria" — sempre retornaria false — sem este teste).
 */
describe("isLoginLockedOut (SEC-4)", () => {
  it("não bloqueia um e-mail sem tentativas falhas", async () => {
    const email = `sem-tentativas-${randomUUID()}@example.com`;
    expect(await isLoginLockedOut(email)).toBe(false);
  });

  it("bloqueia após 8 tentativas falhas recentes (case-insensitive)", async () => {
    const email = `alvo-${randomUUID()}@example.com`;
    for (let i = 0; i < 8; i++) {
      // Capitalização variada — a checagem precisa normalizar (lowercase) dos
      // dois lados para não deixar um atacante contornar variando o case.
      await recordFailedLogin({ email: email.toUpperCase(), ip: "1.2.3.4" });
    }
    expect(await isLoginLockedOut(email)).toBe(true);
  });

  it("NÃO bloqueia um e-mail diferente (isolamento por conta)", async () => {
    const target = `alvo2-${randomUUID()}@example.com`;
    const bystander = `vizinho-${randomUUID()}@example.com`;
    for (let i = 0; i < 8; i++) {
      await recordFailedLogin({ email: target, ip: "1.2.3.4" });
    }
    expect(await isLoginLockedOut(target)).toBe(true);
    expect(await isLoginLockedOut(bystander)).toBe(false);
  });

  it("NÃO bloqueia com poucas tentativas (abaixo do limiar)", async () => {
    const email = `poucas-${randomUUID()}@example.com`;
    for (let i = 0; i < 3; i++) {
      await recordFailedLogin({ email, ip: "1.2.3.4" });
    }
    expect(await isLoginLockedOut(email)).toBe(false);
  });
});
