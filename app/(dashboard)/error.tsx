"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

/** Boundary de erro do app autenticado — renderiza dentro do shell (mantém a nav). */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof Sentry.captureException === "function")
      Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorState
      icon={AlertTriangle}
      title="Algo saiu do lugar"
      description="Tivemos um problema ao carregar esta página. Você pode tentar de novo ou voltar ao início."
    >
      <Button onClick={() => reset()}>Tentar de novo</Button>
      <Button asChild variant="outline">
        <Link href="/dashboard">Ir para o início</Link>
      </Button>
    </ErrorState>
  );
}
