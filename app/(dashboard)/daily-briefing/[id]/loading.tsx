import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton da edição (daily-briefing/[id]) — formato "artigo com seções"
 * distinto do grid de cards do loading.tsx do grupo (dashboard): a página real
 * empilha várias seções (pautas, headlines, copy, visual, sugestões).
 */
export default function EditionLoading() {
  return (
    <div className="space-y-8">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-foreground/10">
        <div className="k-progress-bar h-full w-1/4 rounded-full bg-forest-600 dark:bg-blush-300" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 bg-foreground/[0.07]" />
      </div>

      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-border bg-card p-5"
              >
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full bg-foreground/[0.07]" />
                <Skeleton className="h-4 w-2/3 bg-foreground/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
