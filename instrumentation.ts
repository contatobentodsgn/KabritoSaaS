import * as Sentry from "@sentry/nextjs";

/**
 * Hook de instrumentação do Next 15. Carrega o init do Sentry conforme o runtime
 * e expõe onRequestError para capturar erros de Server Components / route handlers
 * / server actions automaticamente (item §11 "Sentry capturando erros de servidor").
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
