import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

/** 404 dentro do app autenticado (ex.: edição inexistente/expirada). */
export default function DashboardNotFound() {
  return (
    <ErrorState
      icon={Compass}
      title="Não encontramos isso"
      description="O conteúdo que você buscou não existe, expirou ou foi movido."
    >
      <Button asChild>
        <Link href="/dashboard">Ir para o início</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/daily-briefing">Ver edições</Link>
      </Button>
    </ErrorState>
  );
}
