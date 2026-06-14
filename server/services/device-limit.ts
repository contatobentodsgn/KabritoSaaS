/**
 * Lógica PURA do limite de dispositivos (sem I/O) — fácil de testar.
 * Dado o conjunto de sessões ativas e o limite N, decide QUAIS revogar:
 * mantém as N mais recentes (por last_seen_at) e revoga as mais antigas.
 * Garante "login no N+1 revoga o mais antigo".
 */
export interface ActiveSession {
  id: string;
  lastSeenAt: string | null;
}

export function pickSessionsToRevoke(
  active: ActiveSession[],
  limit: number,
): string[] {
  const n = limit > 0 ? limit : 1;
  if (active.length <= n) return [];
  const recentFirst = [...active].sort(
    (a, b) =>
      new Date(b.lastSeenAt ?? 0).getTime() -
      new Date(a.lastSeenAt ?? 0).getTime(),
  );
  return recentFirst.slice(n).map((s) => s.id);
}
