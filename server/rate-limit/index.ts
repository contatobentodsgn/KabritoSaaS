import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { serverEnv } from "@/server/env";

/**
 * RATE LIMITING (TECHNICAL_SPEC §8).
 *
 * Distribuído via **Upstash Redis** (sliding window compartilhado entre todas
 * as instâncias serverless) quando UPSTASH_REDIS_REST_URL (https) + _TOKEN
 * estão presentes. Sem elas — ou se mal configuradas — cai no limiter EM
 * MEMÓRIA por instância (degradação graciosa). Se o Redis falhar em runtime,
 * também cai no fallback (FAIL-OPEN: não trava login por causa do Redis).
 *
 * A construção do cliente é PREGUIÇOSA (na 1ª chamada) e protegida por
 * try/catch — NUNCA no topo do módulo. Assim uma env ausente/inválida não
 * pode derrubar o build (next build avalia o grafo de módulos).
 *
 * Aplicado a: login, cadastro, recuperação de senha e (MVP2) geração sob demanda.
 * Endpoints de cron são protegidos por CRON_SECRET (não por este limiter).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 60_000 },
  register: { limit: 5, windowMs: 60_000 },
  password_reset: { limit: 5, windowMs: 60_000 },
  generation: { limit: 30, windowMs: 60_000 }, // MVP2 — geração sob demanda
  comment: { limit: 20, windowMs: 60_000 }, // anti-spam de comentários (por usuário)
  invite: { limit: 10, windowMs: 60_000 }, // convites/adições de membro (dispara e-mail)
  mfa_verify: { limit: 5, windowMs: 60_000 }, // anti brute-force do código TOTP (por usuário)
  csp_report: { limit: 30, windowMs: 60_000 }, // anti log-flooding no endpoint público de CSP
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

const restUrl = serverEnv.UPSTASH_REDIS_REST_URL?.trim();
const restToken = serverEnv.UPSTASH_REDIS_REST_TOKEN?.trim();

// Cliente + limiters construídos sob demanda e cacheados. Nunca no load do módulo.
let redis: Redis | null = null;
const limiters = new Map<RateLimitAction, Ratelimit>();

// Observabilidade do fallback: quando o Upstash ESTÁ configurado mas falha, o
// rate-limit cai para o limiter em memória (por instância). Antes isso era um
// `catch {}` silencioso — agora avisa UMA vez por instância, para que uma queda
// do Redis seja visível nos logs (e alertável via Sentry quando ligado).
let warnedRedisDown = false;
function noteRedisDown(err: unknown): void {
  if (warnedRedisDown) return;
  warnedRedisDown = true;
  console.error(
    "[rate-limit] Upstash configurado mas indisponível — usando fallback EM MEMÓRIA (por instância, não compartilhado). Erro:",
    err instanceof Error ? err.message : String(err),
  );
}

function getLimiter(action: RateLimitAction): Ratelimit | null {
  // Só ativa com URL REST válida (https) + token; senão, fallback em memória.
  if (!restUrl || !restToken || !restUrl.startsWith("https://")) return null;
  try {
    let rl = limiters.get(action);
    if (!rl) {
      redis ??= new Redis({ url: restUrl, token: restToken });
      const { limit, windowMs } = RATE_LIMITS[action];
      rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: `rl:${action}`,
        analytics: false,
      });
      limiters.set(action, rl);
    }
    return rl;
  } catch (err) {
    noteRedisDown(err); // construção falhou (ex.: URL/token inválidos) → fallback
    return null;
  }
}

/** Limiter em memória (fallback): janela deslizante simples, por instância. */
function consumeInMemory(
  action: RateLimitAction,
  identifier: string,
): RateLimitResult {
  const { limit, windowMs } = RATE_LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Consome 1 do bucket `action:identifier`. Retorna success=false se estourou. */
export async function consume(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(action);
  if (limiter) {
    try {
      const res = await limiter.limit(identifier);
      return { success: res.success, remaining: res.remaining, resetAt: res.reset };
    } catch (err) {
      // Redis indisponível em runtime → fail-open pro limiter em memória.
      // (Decisão deliberada: NÃO fail-closed no login — uma queda do Redis não
      // pode trancar todos os usuários para fora; o fallback ainda limita por
      // instância.) O aviso abaixo torna a degradação observável.
      noteRedisDown(err);
      return consumeInMemory(action, identifier);
    }
  }
  return consumeInMemory(action, identifier);
}

/** Limpeza oportunista de buckets em memória expirados (evita vazamento). */
export function sweep(now = Date.now()) {
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}
