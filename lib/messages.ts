/**
 * Strings de erro/UI repetidas em múltiplos Server Actions. Só o texto exibido
 * ao usuário — sem sistema de i18n, sem template engine.
 */

/** Mensagem de rate-limit com tempo real de espera (UX-4), derivada do
 *  `resetAt` (epoch ms) que `consume()` já calcula — antes descartado em
 *  favor de um texto genérico ("aguarde um minuto") que não refletia o
 *  tempo real restante da janela. */
export function rateLimitMessage(resetAt: number): string {
  const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const wait = seconds < 60 ? `${seconds}s` : `${Math.ceil(seconds / 60)} min`;
  return `Muitas tentativas. Tente novamente em ${wait}.`;
}

export const UNAUTHORIZED = "Não autorizado.";
