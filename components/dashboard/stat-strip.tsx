import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface Stat {
  icon: LucideIcon;
  value: number;
  label: string;
}

/** Faixa de estatísticas do dia (4 células divididas por hairline). */
export function StatStrip({ items }: { items: Stat[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-2 divide-mint-200 lg:grid-cols-4 lg:divide-x">
        {items.map(({ icon: Icon, value, label }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 p-5 ${i >= 2 ? "border-t border-mint-200 lg:border-t-0" : ""} ${i === 1 ? "border-l border-mint-200 lg:border-l-0" : ""} ${i === 3 ? "border-l border-mint-200 lg:border-l-0" : ""}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="font-serif text-2xl font-medium leading-none text-foreground">
                {value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
