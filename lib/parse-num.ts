/**
 * Lê uma env numérica POSITIVA com fallback seguro.
 *
 * `Number("2,00")` (vírgula decimal pt-BR), `Number("$2")` ou `Number("x")` → NaN.
 * Sem este guard, uma comparação de teto como `custo > NaN` é SEMPRE false e
 * desliga o limite silenciosamente. Aqui, qualquer valor inválido ou não-positivo
 * cai no default.
 */
export function numEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
