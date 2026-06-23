import { Redis } from "@upstash/redis";

/**
 * Verifica a conexão com o Upstash Redis usado pelo rate-limit distribuído.
 *
 * Uso: `npm run check:upstash` (lê UPSTASH_REDIS_REST_URL/_TOKEN do .env.local).
 * Não imprime segredos — só o status. Espelha a checagem feita por
 * `consume()` em server/rate-limit/index.ts (URL https + token + PING).
 *
 * Sai com código 1 se mal configurado (rate-limit cairia no fallback em memória).
 */
async function main(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  console.log("URL presente:", !!url, "| começa com https://:", !!url?.startsWith("https://"));
  console.log("TOKEN presente:", !!token, "| tamanho:", token?.length ?? 0);

  if (!url || !token || !url.startsWith("https://")) {
    console.error(
      "❌ UPSTASH_* ausente/inválida — o rate-limit usaria o fallback em memória.",
    );
    process.exit(1);
  }

  try {
    const redis = new Redis({ url, token });
    const pong = await redis.ping();
    await redis.set("rl:selftest", "ok", { ex: 30 });
    const value = await redis.get<string>("rl:selftest");
    if (pong === "PONG" && value === "ok") {
      console.log("✅ Upstash conectado e funcional — rate-limit distribuído ativo.");
    } else {
      console.error("⚠️ Conectou, mas resposta inesperada:", { pong, value });
      process.exit(1);
    }
  } catch (error) {
    console.error(
      "❌ Falha ao conectar (token errado, ou URL não corresponde ao token):",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

void main();
