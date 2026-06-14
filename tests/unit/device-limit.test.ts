import { describe, it, expect } from "vitest";
import { pickSessionsToRevoke } from "@/server/services/device-limit";

describe("Limite de dispositivos (SECURITY_GUIDE §8)", () => {
  const s = (id: string, t: string) => ({ id, lastSeenAt: t });

  it("não revoga nada dentro do limite", () => {
    const active = [s("a", "2026-06-01"), s("b", "2026-06-02")];
    expect(pickSessionsToRevoke(active, 2)).toEqual([]);
  });

  it("login no N+1 revoga o MAIS ANTIGO", () => {
    const active = [
      s("antigo", "2026-06-01T10:00:00Z"),
      s("medio", "2026-06-02T10:00:00Z"),
      s("novo", "2026-06-03T10:00:00Z"), // N+1 (mais recente)
    ];
    const revoked = pickSessionsToRevoke(active, 2);
    expect(revoked).toEqual(["antigo"]);
  });

  it("revoga todos os excedentes (mantém só os N mais recentes)", () => {
    const active = [
      s("a", "2026-06-01"),
      s("b", "2026-06-02"),
      s("c", "2026-06-03"),
      s("d", "2026-06-04"),
    ];
    const revoked = pickSessionsToRevoke(active, 2).sort();
    expect(revoked).toEqual(["a", "b"]);
  });

  it("trata limite <= 0 como 1", () => {
    const active = [s("a", "2026-06-01"), s("b", "2026-06-02")];
    expect(pickSessionsToRevoke(active, 0)).toEqual(["a"]);
  });
});
