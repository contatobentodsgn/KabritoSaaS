/**
 * Scrub de dados sensíveis para o Sentry (beforeSend). Defesa em profundidade
 * além do sendDefaultPii:false:
 *  - remove corpo/cookies/headers de request;
 *  - redige chaves sensíveis (por nome) em qualquer lugar;
 *  - TRUNCA strings longas (barra payloads grandes de conteúdo);
 *  - no `extra` (controlado pela aplicação) aplica ALLOWLIST: só chaves
 *    operacionais conhecidas passam; qualquer outra é DROPADA. Assim um
 *    captureException futuro que passe { extra: { draft, prompt, brandVoice } }
 *    NÃO exfiltra conteúdo do cliente para um terceiro.
 * Sem dependências — roda no server e no client. (LGPD / SECURITY_CHECKLIST — Logs)
 */
const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|api[_-]?key|cookie|session|credential|jwt/i;

// Limite de tamanho de string na telemetria — barra payloads grandes (conteúdo).
const MAX_STRING = 500;

// Chaves SEGURAS em `extra`: metadados operacionais, nunca conteúdo de usuário.
// Para logar uma chave nova, adicione-a aqui conscientemente.
const ALLOWED_EXTRA_KEYS = new Set([
  "runId",
  "editionId",
  "editionDate",
  "platform",
  "platformSlug",
  "area",
  "job",
  "status",
  "statusCode",
  "code",
  "count",
  "attempt",
  "durationMs",
  "reason",
]);

function truncate(value: string): string {
  return value.length > MAX_STRING
    ? `${value.slice(0, MAX_STRING)}…[truncado]`
    : value;
}

function redactDeep(value: unknown, depth = 0): unknown {
  if (value == null || depth > 6) return value;
  if (typeof value === "string") return truncate(value);
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

/**
 * Allowlist do `extra` (app-controlado): chave fora da lista vira "[dropped]".
 * É a barreira contra vazar conteúdo do cliente por engano num captureException.
 */
function allowlistExtra(extra: unknown): unknown {
  if (extra == null || typeof extra !== "object" || Array.isArray(extra)) {
    return redactDeep(extra);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extra as Record<string, unknown>)) {
    if (!ALLOWED_EXTRA_KEYS.has(k)) {
      out[k] = "[dropped]";
      continue;
    }
    out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redactDeep(v);
  }
  return out;
}

/** Higieniza um evento do Sentry no lugar (mutável). */
export function scrubSentryEvent(event: Record<string, unknown>): void {
  const req = event.request as Record<string, unknown> | undefined;
  if (req) {
    delete req.data;
    delete req.cookies;
    delete req.headers;
  }
  if (event.extra) event.extra = allowlistExtra(event.extra);
  if (event.contexts) event.contexts = redactDeep(event.contexts);
  if (event.tags) event.tags = redactDeep(event.tags);
}
