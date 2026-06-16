import "server-only";
import { safeFetchUrl } from "./safe-fetch";

/**
 * Conector de tendências (fonte legal — sem scraping de redes).
 * Dois modos, ambos best-effort e isolados:
 *  - config.terms: string[]  -> "tema em alta: <termo>" (até 30).
 *  - config.url: string      -> fetch RSS/JSON e extrai títulos/termos.
 *
 * config esperado:
 *  - terms?: string[]
 *  - url?: string
 *  - field?: string (campo de cada item JSON; default = item já é string)
 */
export async function collectTrends(config: Record<string, unknown>): Promise<string[]> {
  if (Array.isArray(config.terms)) {
    return config.terms
      .filter((x): x is string => typeof x === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 30)
      .map((t) => `tema em alta: ${t}`);
  }

  const url = typeof config.url === "string" ? safeFetchUrl(config.url) : null;
  if (!url) return [];

  const res = await fetch(url, {
    headers: {
      "user-agent": "InteligenciaCriativaBot/1.0 (+trends)",
      accept: "application/json, application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Trends ${res.status} em ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();

  const looksJson = contentType.includes("json") || /^\s*[[{]/.test(body);
  const raw = looksJson ? extractFromJson(body, config) : extractFromRss(body);

  return raw
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((t) => `tema em alta: ${t}`);
}

/** Extrai títulos de um feed RSS/Atom por regex (sem dependência extra). */
function extractFromRss(xml: string): string[] {
  const titles: string[] = [];
  const re = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gis;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && titles.length < 31) {
    const t = m[1]?.trim();
    if (t) titles.push(t);
  }
  // o primeiro <title> costuma ser o do canal; remove-o
  return titles.slice(1);
}

/** Extrai termos de um JSON (array na raiz ou objeto best-effort). */
function extractFromJson(body: string, config: Record<string, unknown>): string[] {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return [];
  }

  const arr = pickArray(json);
  if (!arr) return [];

  const field = typeof config.field === "string" ? config.field : null;
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      out.push(item);
    } else if (isRecord(item)) {
      const v = field ? item[field] : (item.title ?? item.name ?? item.query ?? item.term);
      if (typeof v === "string") out.push(v);
    }
  }
  return out;
}

/** Acha o primeiro array útil: raiz, ou uma chave que seja array. */
function pickArray(root: unknown): unknown[] | null {
  if (Array.isArray(root)) return root;
  if (isRecord(root)) {
    for (const value of Object.values(root)) {
      if (Array.isArray(value)) return value;
    }
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
