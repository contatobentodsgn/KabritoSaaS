import { describe, it, expect } from "vitest";
import { numEnv } from "@/lib/parse-num";

/**
 * Regressão do teto de custo/tokens (checklist §11 — Pipeline).
 * Um valor de env não-numérico NÃO pode virar NaN e desligar o teto: deve cair
 * no default. Cobre o furo encontrado na auditoria adversarial.
 */
describe("numEnv (guard de teto numérico)", () => {
  it("usa o valor quando é número positivo válido", () => {
    expect(numEnv("2.50", 2.0)).toBe(2.5);
    expect(numEnv("200000", 1)).toBe(200000);
  });

  it("cai no default quando ausente ou vazio", () => {
    expect(numEnv(undefined, 2.0)).toBe(2.0);
    expect(numEnv("", 2.0)).toBe(2.0);
  });

  it("cai no default para entrada inválida (NaN) — não desliga o teto", () => {
    expect(numEnv("2,00", 2.0)).toBe(2.0); // vírgula decimal pt-BR
    expect(numEnv("$2", 2.0)).toBe(2.0);
    expect(numEnv("abc", 2.0)).toBe(2.0);
    expect(numEnv("NaN", 2.0)).toBe(2.0);
    expect(numEnv("Infinity", 2.0)).toBe(2.0);
  });

  it("cai no default para valores não-positivos", () => {
    expect(numEnv("0", 2.0)).toBe(2.0);
    expect(numEnv("-5", 2.0)).toBe(2.0);
  });
});
