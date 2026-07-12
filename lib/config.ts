/**
 * Constantes numéricas de configuração (fallbacks de env var + limites fixos
 * de negócio). Segredos ficam em server/env.ts; isto aqui é só magic number
 * nomeado, sem lógica.
 */

/** Limite de dispositivos ativos por usuário (seção 11), quando DEVICE_LIMIT não é setado. */
export const DEFAULT_DEVICE_LIMIT = 2;

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 60_000 },
  register: { limit: 5, windowMs: 60_000 },
  resend_confirmation: { limit: 1, windowMs: 60_000 }, // reenvio de e-mail de confirmação — bucket próprio (UX-1), separado do "register" p/ o botão ter um cooldown previsível
  password_reset: { limit: 5, windowMs: 60_000 },
  generation: { limit: 30, windowMs: 60_000 }, // MVP2 — geração sob demanda
  comment: { limit: 20, windowMs: 60_000 }, // anti-spam de comentários (por usuário)
  invite: { limit: 10, windowMs: 60_000 }, // convites/adições de membro (dispara e-mail)
  mfa_verify: { limit: 5, windowMs: 60_000 }, // anti brute-force do código TOTP (por usuário)
  csp_report: { limit: 30, windowMs: 60_000 }, // anti log-flooding no endpoint público de CSP
  data_export: { limit: 5, windowMs: 60_000 }, // exportação de dados (LGPD) — 5 queries por chamada
  avatar_upload: { limit: 10, windowMs: 60_000 }, // upload de avatar (Storage)
  invite_accept: { limit: 10, windowMs: 60_000 }, // aceite de convite por token (por usuário)
} as const;

/** Bloqueio progressivo por conta (SEC-4): janela deslizante + threshold de falhas. */
export const LOCKOUT_WINDOW_MIN = 15;
export const LOCKOUT_THRESHOLD = 8;

/** Retenções LGPD (§10) do job diário de ciclo de vida. */
export const RAW_SIGNAL_RETENTION_DAYS = 7;
export const LOG_RETENTION_DAYS = 180;
export const ACCEPTED_INVITE_RETENTION_DAYS = 30;
