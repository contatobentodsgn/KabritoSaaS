import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

/** 404 global (rotas públicas / fora do app autenticado). */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
      <div className="w-full">
        <ErrorState
          icon={Compass}
          title="Página não encontrada"
          description="O endereço que você buscou não existe ou foi movido."
        >
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </ErrorState>
      </div>
    </div>
  );
}
