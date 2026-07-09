import "server-only";
import { safeFetch } from "./safe-fetch";

/**
 * Conector RSS (fonte legal). Faz fetch do feed e extrai títulos dos itens.
 * Parser mínimo por regex (sem dependência extra). Best-effort.
 */
export async function collectRss(
  config: Record<string, unknown>,
): Promise<string[]> {
  const res =
    typeof config.url === "string"
      ? await safeFetch(config.url, {
          headers: { "user-agent": "InteligenciaCriativaBot/1.0 (+rss)" },
          signal: AbortSignal.timeout(10_000),
        })
      : null;
  if (!res) return [];
  if (!res.ok) throw new Error(`RSS ${res.status} em ${res.url}`);
  const xml = await res.text();
  const titles: string[] = [];
  const re = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gis;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && titles.length < 30) {
    const t = m[1]?.trim();
    if (t) titles.push(t);
  }
  // o primeiro <title> costuma ser o do canal; remove-o
  return titles.slice(1);
}
