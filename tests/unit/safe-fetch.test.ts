import { describe, it, expect } from "vitest";
import { safeFetchUrl } from "@/server/pipeline/ingest/safe-fetch";

describe("safeFetchUrl (anti-SSRF nos conectores de ingestão)", () => {
  it("aceita URLs públicas http/https", () => {
    expect(safeFetchUrl("https://news.google.com/rss")?.hostname).toBe("news.google.com");
    expect(safeFetchUrl("http://example.com/feed")?.hostname).toBe("example.com");
  });

  it("bloqueia loopback, localhost e metadata de cloud", () => {
    expect(safeFetchUrl("http://127.0.0.1/")).toBeNull();
    expect(safeFetchUrl("http://localhost:3000/")).toBeNull();
    expect(safeFetchUrl("http://169.254.169.254/latest/meta-data/")).toBeNull();
    expect(safeFetchUrl("http://[::1]/")).toBeNull();
    expect(safeFetchUrl("http://metadata.google.internal/")).toBeNull();
  });

  it("bloqueia ranges IPv4 privados", () => {
    expect(safeFetchUrl("http://10.0.0.5/")).toBeNull();
    expect(safeFetchUrl("http://192.168.1.1/")).toBeNull();
    expect(safeFetchUrl("http://172.16.0.1/")).toBeNull();
    expect(safeFetchUrl("http://0.0.0.0/")).toBeNull();
  });

  it("bloqueia esquemas não-http, hosts internos e entradas inválidas", () => {
    expect(safeFetchUrl("file:///etc/passwd")).toBeNull();
    expect(safeFetchUrl("ftp://example.com/")).toBeNull();
    expect(safeFetchUrl("http://db.internal/")).toBeNull();
    expect(safeFetchUrl("servidor.local")).toBeNull();
    expect(safeFetchUrl("não é uma url")).toBeNull();
  });
});
