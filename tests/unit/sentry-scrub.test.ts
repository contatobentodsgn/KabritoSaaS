import { describe, it, expect } from "vitest";
import { scrubSentryEvent } from "@/lib/security/sentry-scrub";

describe("scrubSentryEvent", () => {
  it("dropa chaves não-allowlistadas em extra (anti-vazamento de conteúdo)", () => {
    const event: Record<string, unknown> = {
      extra: {
        draft: "rascunho gerado pela IA",
        prompt: "voz da marca confidencial",
        runId: "run_123",
        editionDate: "2026-06-23",
      },
    };
    scrubSentryEvent(event);
    const extra = event.extra as Record<string, unknown>;
    expect(extra.draft).toBe("[dropped]");
    expect(extra.prompt).toBe("[dropped]");
    expect(extra.runId).toBe("run_123"); // allowlistado → passa
    expect(extra.editionDate).toBe("2026-06-23");
  });

  it("redige chaves sensíveis e remove request body/cookies/headers", () => {
    const event: Record<string, unknown> = {
      request: { data: "x", cookies: "y", headers: { a: 1 }, url: "/ok" },
      contexts: { auth: { token: "segredo", note: "ok" } },
    };
    scrubSentryEvent(event);
    const req = event.request as Record<string, unknown>;
    expect(req.data).toBeUndefined();
    expect(req.cookies).toBeUndefined();
    expect(req.headers).toBeUndefined();
    expect(req.url).toBe("/ok");
    const ctx = event.contexts as { auth: Record<string, unknown> };
    expect(ctx.auth.token).toBe("[redacted]");
    expect(ctx.auth.note).toBe("ok");
  });

  it("trunca strings longas em contexts", () => {
    const long = "a".repeat(1000);
    const event: Record<string, unknown> = {
      contexts: { extraCtx: { big: long } },
    };
    scrubSentryEvent(event);
    const ctx = event.contexts as { extraCtx: Record<string, unknown> };
    const big = ctx.extraCtx.big as string;
    expect(big.length).toBeLessThan(600);
    expect(big).toContain("[truncado]");
  });
});
