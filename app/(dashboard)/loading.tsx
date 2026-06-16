/**
 * Skeleton de carregamento (App Router) mostrado em TODA navegação do dashboard
 * enquanto o servidor responde — em vez de tela parada. CSS puro (animate-pulse +
 * barra indeterminada), zero JS: melhora a PERCEPÇÃO de velocidade sem custo.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Barra de progresso fina no topo (indeterminada, CSS). */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-foreground/10">
        <div className="k-progress-bar h-full w-1/4 rounded-full bg-forest-600 dark:bg-blush-300" />
      </div>

      {/* Cabeçalho. (bg-foreground/10 adapta sozinho claro↔escuro) */}
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-foreground/10" />
        <div className="h-8 w-64 rounded-md bg-foreground/10" />
        <div className="h-4 w-80 rounded bg-foreground/[0.07]" />
      </div>

      {/* Grade de cards. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border bg-card p-5"
          >
            <div className="size-10 rounded-full bg-foreground/10" />
            <div className="mt-4 h-5 w-2/3 rounded bg-foreground/10" />
            <div className="mt-2 h-4 w-full rounded bg-foreground/[0.07]" />
            <div className="mt-6 flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-foreground/[0.07]" />
              <div className="h-3 w-20 rounded bg-foreground/[0.07]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
