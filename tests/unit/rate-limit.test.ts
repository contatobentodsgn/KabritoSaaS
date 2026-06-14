import { describe, it, expect } from "vitest";
import { consume, RATE_LIMITS } from "@/server/rate-limit";

describe("Rate limiting (TECHNICAL_SPEC §8)", () => {
  it("permite até o limite e bloqueia depois", async () => {
    const id = `ip-${Math.floor(performance.now())}-${process.pid}`;
    const { limit } = RATE_LIMITS.login;
    let lastSuccess = true;
    for (let i = 0; i < limit; i++) {
      const r = await consume("login", id);
      lastSuccess = r.success;
    }
    expect(lastSuccess).toBe(true); // a N-ésima ainda passa
    const over = await consume("login", id);
    expect(over.success).toBe(false); // N+1 bloqueada
    expect(over.remaining).toBe(0);
  });

  it("isola buckets por identificador", async () => {
    const a = await consume("register", "ipA");
    const b = await consume("register", "ipB");
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});
