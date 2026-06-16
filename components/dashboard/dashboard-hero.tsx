import { Clock, CheckCircle2, CircleSlash } from "lucide-react";

/** Motivo decorativo sutil (colinas + folha + brilho) — evoca a marca sem peso. */
function DecorMotif() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 360 200"
      className="pointer-events-none absolute -right-4 bottom-0 hidden h-[160px] w-auto text-forest-700/[0.07] dark:text-forest-200/[0.06] md:block"
      fill="none"
    >
      <path d="M0 200 Q90 120 180 160 T360 130 V200 Z" fill="currentColor" />
      <path d="M120 200 Q200 110 290 150 T360 120 V200 Z" fill="currentColor" />
      <path
        d="M250 70c-18 0-30 12-30 30 0 18 12 30 30 30 0-18 18-24 18-42-6 0-18 4-18 18 0-14-6-18-18-18Z"
        fill="currentColor"
      />
      <path d="M250 130V96" stroke="currentColor" strokeWidth="2" />
      <path d="M300 60l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="currentColor" />
    </svg>
  );
}

function StatusPill({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon: typeof Clock;
  children: React.ReactNode;
  tone?: "default" | "ok" | "muted";
}) {
  const toneCls =
    tone === "ok"
      ? "text-forest-700 dark:text-forest-200"
      : tone === "muted"
        ? "text-rose-700 dark:text-blush-300"
        : "text-muted-foreground";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-200 dark:border-forest-800 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
      <Icon className={`size-3.5 ${toneCls}`} />
      <span className={toneCls}>{children}</span>
    </span>
  );
}

export function DashboardHero({
  name,
  updatedLabel,
  active,
  hasEdition,
}: {
  name: string;
  updatedLabel?: string | null;
  active: boolean;
  hasEdition: boolean;
}) {
  const subtitle = !active
    ? "Ative sua assinatura para acessar a edição de hoje."
    : hasEdition
      ? "Sua edição de hoje está pronta."
      : "Assim que a equipe publicar a edição do dia, ela aparece aqui.";

  return (
    <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-mint-100 dark:from-forest-900 via-mint-50 dark:via-forest-950 to-card px-6 py-8 sm:px-8">
      <DecorMotif />
      <div className="relative max-w-2xl space-y-3">
        <p className="k-eyebrow">Hoje</p>
        <h1 className="font-serif text-[2.25rem] font-medium leading-tight tracking-[-0.02em] text-foreground">
          Olá, {name}
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {updatedLabel && <StatusPill icon={Clock}>{updatedLabel}</StatusPill>}
          <StatusPill icon={active ? CheckCircle2 : CircleSlash} tone={active ? "ok" : "muted"}>
            {active ? "Assinatura ativa" : "Assinatura inativa"}
          </StatusPill>
        </div>
      </div>
    </section>
  );
}
