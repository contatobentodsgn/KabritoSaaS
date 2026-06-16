import { TrendingUp, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BriefingBlock } from "@/types/content";

type ColTone = "forest" | "warn";
const COLUMNS: {
  key: keyof BriefingBlock;
  title: string;
  icon: LucideIcon;
  tone: ColTone;
}[] = [
  { key: "whats_growing", title: "Em alta", icon: TrendingUp, tone: "forest" },
  { key: "opportunities", title: "Oportunidades", icon: Sparkles, tone: "forest" },
  { key: "whats_saturated", title: "Saturado", icon: AlertTriangle, tone: "warn" },
  { key: "practical_recommendations", title: "Recomendações práticas", icon: CheckCircle2, tone: "forest" },
];

/** "Resumo do dia" — o briefing destrinchado em 4 colunas acionáveis. */
export function BriefingSummary({
  briefing,
  platform,
}: {
  briefing: BriefingBlock;
  platform: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
        <CardTitle>Resumo do dia</CardTitle>
        <span className="text-sm text-muted-foreground">
          Briefing do dia para {platform}
        </span>
      </CardHeader>
      <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map(({ key, title, icon: Icon, tone }) => {
          const items = (briefing[key] as string[] | undefined) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon
                  className={`size-[18px] ${tone === "warn" ? "text-rose-500" : "text-forest-600 dark:text-forest-300"}`}
                  strokeWidth={1.75}
                />
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              </div>
              <ul className="space-y-1.5">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-mint-400 dark:bg-forest-400" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
