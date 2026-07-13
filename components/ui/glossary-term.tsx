"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

/**
 * Affordance de glossário (SEO-7) — ícone "i" ao lado de um termo interno
 * ("edição", "pauta") que revela a definição em texto simples. Fica sempre
 * disponível (não é "mostra 1x e some"): para rótulos estáticos como o menu
 * lateral, "1º uso" na prática é "sempre há uma explicação a um hover/tab de
 * distância", não rastreamento de sessão. Focável por teclado e revelado no
 * foco (Radix Tooltip cuida disso nativamente).
 */
export function GlossaryTerm({
  term,
  definition,
  className,
}: {
  term: string;
  definition: string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`O que significa "${term}"?`}
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground k-transition hover:text-foreground k-focus",
              className,
            )}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>{definition}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
