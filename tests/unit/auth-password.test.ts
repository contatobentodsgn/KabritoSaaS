import { describe, it, expect } from "vitest";
import { strongPassword, newPasswordSchema } from "@/lib/validations/auth";

/** Regras de senha forte (cadastro + redefinição) — 8+, maiúscula, minúscula, número. */
describe("strongPassword", () => {
  it("aceita senha forte", () => {
    expect(strongPassword.safeParse("Senha123").success).toBe(true);
  });
  it("rejeita curta (<8)", () => {
    expect(strongPassword.safeParse("Ab1").success).toBe(false);
  });
  it("rejeita sem maiúscula", () => {
    expect(strongPassword.safeParse("senha123").success).toBe(false);
  });
  it("rejeita sem minúscula", () => {
    expect(strongPassword.safeParse("SENHA123").success).toBe(false);
  });
  it("rejeita sem número", () => {
    expect(strongPassword.safeParse("SenhaForte").success).toBe(false);
  });
});

describe("newPasswordSchema — confirmação", () => {
  it("aceita quando as senhas conferem", () => {
    const r = newPasswordSchema.safeParse({
      password: "Senha123",
      confirmPassword: "Senha123",
    });
    expect(r.success).toBe(true);
  });
  it("rejeita quando as senhas não conferem", () => {
    const r = newPasswordSchema.safeParse({
      password: "Senha123",
      confirmPassword: "Outra123",
    });
    expect(r.success).toBe(false);
  });
});
