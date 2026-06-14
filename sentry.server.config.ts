import * as Sentry from "@sentry/nextjs";

/**
 * Sentry — runtime Node (server actions, route handlers, pipeline, cron).
 * GATED no DSN: sem SENTRY_DSN, `enabled:false` torna tudo no-op (não envia nada,
 * não muda o comportamento em produção). Ativa só quando o DSN é configurado.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  // Não captura PII por padrão (LGPD — só erros/stack, sem corpo de request).
  sendDefaultPii: false,
});
