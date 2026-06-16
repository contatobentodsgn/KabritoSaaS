/**
 * Content-Security-Policy do app.
 *
 * Estratégia (decisão do produto): começa em REPORT-ONLY (CSP_ENFORCE=false) —
 * o navegador NÃO bloqueia nada, só envia violações para /api/csp-report. Isso
 * permite validar todos os fluxos (Supabase auth/storage/realtime, Sentry, etc.)
 * contra o runtime real antes de promover para enforcing (basta flipar a flag).
 *
 * Scripts: SEM 'unsafe-inline'. Usa nonce por requisição + 'strict-dynamic'
 * (cobre os scripts do Next e os 2 inline scripts nossos, que recebem o nonce).
 * Estilos: 'unsafe-inline' é a única exceção pragmática — atributos `style`
 * inline do React/GSAP não aceitam nonce; o risco de injeção via estilo é baixo.
 */
export const CSP_ENFORCE = false;

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

export function buildCsp(nonce: string): string {
  const sb = supabaseSources();
  const connect = ["'self'", sb.http, sb.ws].filter(Boolean).join(" ");
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
