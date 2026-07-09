import "server-only";
import { safeFetch } from "./safe-fetch";

/**
 * Conector de API genérico (fonte legal — sem scraping de redes).
 * Faz fetch de um endpoint JSON e extrai um array no caminho `config.path`
 * (dot-path simples: "articles" ou "data.items"). De cada item pega o campo
 * `config.field`; se o item já for string, usa-o direto. Best-effort, isolado.
 *
 * config esperado:
 *  - url: string (obrigatório)
 *  - path?: string (dot-path até o array; default = raiz se já for array)
 *  - field?: string (campo de cada item; default = item já é string)
 */
export async function collectApi(
  config: Record<string, unknown>,
): Promise<string[]> {
  const res =
    typeof config.url === "string"
      ? await safeFetch(config.url, {
          headers: {
            "user-agent": "InteligenciaCriativaBot/1.0 (+api)",
            accept: "application/json",
          },
          signal: AbortSignal.timeout(10_000),
        })
      : null;
  if (!res) return [];
  if (!res.ok) throw new Error(`API ${res.status} em ${res.url}`);

  const json: unknown = await res.json();

  const path = typeof config.path === "string" ? config.path : "";
  const arr = resolveArray(json, path);
  if (!arr) return [];

  const field = typeof config.field === "string" ? config.field : null;
  const out: string[] = [];
  for (const item of arr) {
    if (out.length >= 30) break;
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    } else if (field && isRecord(item)) {
      const v = item[field];
      if (typeof v === "string") {
        const t = v.trim();
        if (t) out.push(t);
      }
    }
  }
  return out;
}

/** Resolve um dot-path simples e retorna o valor se for array; senão null. */
function resolveArray(root: unknown, path: string): unknown[] | null {
  if (!path) return Array.isArray(root) ? root : null;
  let cur: unknown = root;
  for (const key of path.split(".")) {
    if (!key) continue;
    if (!isRecord(cur)) return null;
    cur = cur[key];
  }
  return Array.isArray(cur) ? cur : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
