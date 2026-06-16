/**
 * Estrutura de RATE LIMITING (TECHNICAL_SPEC §8).
 *
 * MVP: limiter em memória (janela deslizante simples, por instância). A
 * interface já está pronta para trocar por Upstash Redis (distribuído) no
 * futuro — basta reimplementar `consume()` chamando o Redis.
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
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/** Consome 1 do bucket `action:identifier`. Retorna success=false se estourou. */
export async function consume(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
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

/** Limpeza oportunista de buckets expirados (evita vazamento de memória). */
export function sweep(now = Date.now()) {
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}
