import "server-only";

/**
 * Seed mínimo (reforço, não dependência): alguém cola 2–3 links/temas do dia
 * no admin (config.items: string[] ou config.seed: string). A IA expande.
 * É "humano", mas trivial e não é "produção" (PROJECT §7).
 */
export function collectSeed(config: Record<string, unknown>): string[] {
  if (Array.isArray(config.items)) {
    return config.items.filter((x): x is string => typeof x === "string");
  }
  if (typeof config.seed === "string") {
    return config.seed
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
