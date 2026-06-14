import * as Sentry from "@sentry/nextjs";

/**
 * Sentry — runtime Edge (middleware). GATED no DSN (no-op sem SENTRY_DSN).
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
