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
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof Sentry.captureException === "function") Sentry.captureException(error);
  }, [error]);

  // Substitui o root layout → globals.css não se aplica; estilo inline na marca.
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 24,
          background: "#EBF2EB",
          color: "#0b3d0b",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>Algo saiu do lugar</h2>
          <p style={{ color: "#598b56", margin: "0 0 20px", lineHeight: 1.5 }}>
            Tivemos um problema inesperado. Já fomos avisados — tente recarregar.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#075102",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
            <a
              href="/"
              style={{
                color: "#075102",
                fontWeight: 600,
                textDecoration: "none",
                alignSelf: "center",
              }}
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
