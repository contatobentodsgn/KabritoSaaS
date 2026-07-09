import { randomUUID } from "node:crypto";
import { describe, it, expect } from "vitest";
import { asUser, asService } from "./helpers";

/**
 * SEC-3 — RLS de mfa_recovery_codes (migration 0017). Testa a policy "own
 * row" contra Postgres real: as funções de geração/verificação em
 * server/auth/mfa.ts usam o cliente Next.js (cookies()), que não roda fora de
 * um request — então o que dá pra (e vale a pena) verificar aqui É a fronteira
 * de segurança real, a RLS em si, com SQL direto (mesmo padrão do resto de
 * rls.test.ts). Não depende de fixtures.ts: a tabela não tem FK (mesmo padrão
 * de access_logs/audit_logs), UUIDs soltos bastam.
 */
describe("mfa_recovery_codes — RLS own-row (SEC-3)", () => {
  const userA = randomUUID();
  const userB = randomUUID();

  it("A insere um código próprio", async () => {
    const rows = await asUser(
      userA,
      (tx) =>
        tx`insert into mfa_recovery_codes (user_id, code_hash) values (${userA}, 'hash-a') returning id`,
    );
    expect(rows.length).toBe(1);
  });

  it("A lê o próprio código; B NÃO lê o código de A", async () => {
    const asOwner = await asUser(
      userA,
      (tx) => tx`select id from mfa_recovery_codes where user_id = ${userA}`,
    );
    expect(asOwner.length).toBe(1);

    const asOther = await asUser(
      userB,
      (tx) => tx`select id from mfa_recovery_codes where user_id = ${userA}`,
    );
    expect(asOther.length).toBe(0);
  });

  it("B NÃO marca como usado o código de A (0 linhas)", async () => {
    const res = await asUser(
      userB,
      (tx) =>
        tx`update mfa_recovery_codes set used_at = now() where user_id = ${userA}`,
    );
    expect(res.count).toBe(0);
  });

  it("B NÃO insere um código para A (WITH CHECK rejeita)", async () => {
    await expect(
      asUser(
        userB,
        (tx) =>
          tx`insert into mfa_recovery_codes (user_id, code_hash) values (${userA}, 'hash-forjado')`,
      ),
    ).rejects.toThrow();
  });

  it("A marca o próprio código como usado", async () => {
    const res = await asUser(
      userA,
      (tx) =>
        tx`update mfa_recovery_codes set used_at = now() where user_id = ${userA}`,
    );
    expect(res.count).toBe(1);
  });

  it("B NÃO apaga o código de A; A apaga o próprio", async () => {
    const bDeletes = await asUser(
      userB,
      (tx) => tx`delete from mfa_recovery_codes where user_id = ${userA}`,
    );
    expect(bDeletes.count).toBe(0);

    const aDeletes = await asUser(
      userA,
      (tx) => tx`delete from mfa_recovery_codes where user_id = ${userA}`,
    );
    expect(aDeletes.count).toBe(1);
  });

  it("service_role NÃO tem grant nesta tabela (decisão de design, não RLS)", async () => {
    // Diferente do resto do schema: aqui o service_role é deliberadamente SEM
    // grant (mesmo padrão de dashboard_cards/migration 0010) — toda geração/
    // verificação de recovery code passa pelo cliente JWT do próprio usuário;
    // não há caminho de código isolado que precise ler esta tabela via
    // service-role. "permission denied for table" (não RLS) é o esperado.
    await expect(
      asService(
        (tx) =>
          tx`insert into mfa_recovery_codes (user_id, code_hash) values (${userA}, 'hash-b')`,
      ),
    ).rejects.toThrow(/permission denied/i);
  });
});
