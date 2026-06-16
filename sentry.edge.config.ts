import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/security/sentry-scrub";

/**
 * Sentry — runtime Edge (middleware). GATED no DSN (no-op sem SENTRY_DSN).
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    scrubSentryEvent(event as unknown as Record<string, unknown>);
    return event;
  },
});
