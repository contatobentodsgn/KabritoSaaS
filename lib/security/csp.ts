/**
 * Content-Security-Policy do app.
 *
 * ESTADO ATUAL: ENFORCING (CSP_ENFORCE=true) — o navegador BLOQUEIA o que não
 * estiver na política e ainda reporta para /api/csp-report. Foi validada em
 * Report-Only em produção (todos os fluxos: Supabase, Sentry, upload) antes de
 * promover. Para depurar uma violação nova sem quebrar, basta voltar a flag para
 * false (vira Report-Only) — ver CSP_RESPONSE_HEADER abaixo.
 *
 * Scripts: SEM 'unsafe-inline'. Usa nonce por requisição + 'strict-dynamic'
 * (cobre os scripts do Next e os 2 inline scripts nossos, que recebem o nonce).
 * Estilos: 'unsafe-inline' é a única exceção pragmática — atributos `style`
 * inline do React/GSAP não aceitam nonce; o risco de injeção via estilo é baixo.
 */
export const CSP_ENFORCE = true;

export const CSP_REQUEST_HEADER = "Content-Security-Policy";
export const CSP_RESPONSE_HEADER = CSP_ENFORCE
  ? "Content-Security-Policy"
  : "Content-Security-Policy-Report-Only";

function supabaseSources(): { http: string; ws: string } {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return { http: "", ws: "" };
  try {
    const u = new URL(raw);
    return { http: u.origin, ws: `wss://${u.host}` };
  } catch {
    return { http: "", ws: "" };
  }
}

/** Origem de ingestão do Sentry (do DSN), p/ o SDK do browser enviar eventos. */
function sentryOrigin(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return "";
  try {
    return new URL(dsn).origin; // ex.: https://o123.ingest.us.sentry.io
  } catch {
    return "";
  }
}

export function buildCsp(nonce: string): string {
  const sb = supabaseSources();
  const connect = ["'self'", sb.http, sb.ws, sentryOrigin()]
    .filter(Boolean)
    .join(" ");
  const img = ["'self'", "data:", "blob:", sb.http].filter(Boolean).join(" ");

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${img}`,
    `font-src 'self'`,
    `connect-src ${connect}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `form-action 'self'`,
    `report-uri /api/csp-report`,
  ].join("; ");
}
