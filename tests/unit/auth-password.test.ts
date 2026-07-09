import { describe, it, expect } from "vitest";
import {
  strongPassword,
  newPasswordSchema,
  loginSchema,
} from "@/lib/validations/auth";

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

/* SEC-9 — todo campo de texto tem um teto (defesa contra payload gigante). */
describe("loginSchema — teto de tamanho (SEC-9)", () => {
  it("aceita e-mail e senha de tamanho normal", () => {
    const r = loginSchema.safeParse({
      email: "user@example.com",
      password: "qualquer-coisa",
    });
    expect(r.success).toBe(true);
  });
  it("rejeita e-mail acima de 254 caracteres", () => {
    const huge = `${"a".repeat(250)}@example.com`;
    const r = loginSchema.safeParse({ email: huge, password: "x" });
    expect(r.success).toBe(false);
  });
  it("rejeita senha acima de 200 caracteres", () => {
    const r = loginSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(201),
    });
    expect(r.success).toBe(false);
  });
});
