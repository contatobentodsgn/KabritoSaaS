import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton do grupo (admin) — cobre review/runs/sources/cards/prompts/analytics
 * (nenhuma tinha loading.tsx antes). Formato "lista de cards" combina com a
 * maioria dessas telas (fila de revisão, runs, fontes); é o melhor default
 * genérico disponível sem um loading.tsx por página.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-foreground/10">
        <div className="k-progress-bar h-full w-1/4 rounded-full bg-forest-600 dark:bg-blush-300" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 bg-foreground/[0.07]" />
      </div>

      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-1/3 bg-foreground/[0.07]" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
