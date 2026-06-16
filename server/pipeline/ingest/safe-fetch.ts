import "server-only";

/**
 * Anti-SSRF para os conectores de ingestão (config.url vem de uma fonte criada
 * por superadmin, mas a URL nunca era validada antes de cair em fetch()).
 * Aceita só http/https e bloqueia hosts de loopback, link-local (metadata de
 * cloud: 169.254.169.254), ranges privados e multicast. Retorna a URL validada
 * (objeto URL) ou null se for inválida/insegura.
 */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, ""); // tira colchetes de IPv6
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;

  // IPv4 literal em ranges loopback/link-local/privados/reservados.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + metadata de cloud
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reservado
  }

  // IPv6 loopback / ULA (fc00::/7) / link-local (fe80::/10).
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe8")) {
    return true;
  }
  return false;
}

export function safeFetchUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (isPrivateHost(u.hostname)) return null;
  return u;
}
