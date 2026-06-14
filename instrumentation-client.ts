import * as Sentry from "@sentry/nextjs";

/**
 * Sentry no client. Usa NEXT_PUBLIC_SENTRY_DSN (DSN é público por design — seguro
 * no bundle). GATED: sem a var, `enabled:false` = no-op. Sem session replay para
 * não pesar o bundle nem capturar PII (LGPD).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
