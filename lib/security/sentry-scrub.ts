/**
 * Scrub de dados sensíveis para o Sentry (beforeSend). Defesa em profundidade
 * além do sendDefaultPii:false: remove corpo/cookies/headers de request e redige
 * qualquer chave sensível em extra/contexts (ex.: um captureException futuro que
 * passe { extra: { token } } não vaza). Sem dependências — roda no server e no
 * client. (LGPD / SECURITY_CHECKLIST — Logs)
 */
const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|api[_-]?key|cookie|session|credential|jwt/i;

function redactDeep(value: unknown, depth = 0): unknown {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redactDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Higieniza um evento do Sentry no lugar (mutável). */
export function scrubSentryEvent(event: Record<string, unknown>): void {
  const req = event.request as Record<string, unknown> | undefined;
  if (req) {
    delete req.data;
    delete req.cookies;
    delete req.headers;
  }
  if (event.extra) event.extra = redactDeep(event.extra);
  if (event.contexts) event.contexts = redactDeep(event.contexts);
}
