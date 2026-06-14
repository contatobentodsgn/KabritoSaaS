"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Boundary global de erro (App Router). Reporta ao Sentry os erros de render do
 * React que escapam dos boundaries de rota — recomendação oficial do SDK. Por ser
 * o último recurso, renderiza seu próprio <html>/<body>.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Algo deu errado.</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            Tivemos um problema inesperado. Já fomos avisados.
          </p>
          <a href="/" style={{ color: "#0a5", fontWeight: 600 }}>
            Voltar ao início
          </a>
        </div>
      </body>
    </html>
  );
}
