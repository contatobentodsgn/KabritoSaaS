import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pills,
  Field,
  SaturationBadge,
  RiskBadge,
  ScoreBadge,
} from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import type { TrendItemRow } from "@/types/content";

export function TrendCard({
  trend,
  favorited,
}: {
  trend: TrendItemRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-2">
          <CardTitle>{trend.title}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <ScoreBadge score={trend.opportunity_score} />
            <SaturationBadge level={trend.saturation_level} />
            <RiskBadge level={trend.risk_level} />
          </div>
        </div>
        <FavoriteButton
          entityType="trend_item"
          entityId={trend.id}
          initial={favorited}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Contexto">{trend.context}</Field>
        <Field label="Por que importa">{trend.why_it_matters}</Field>
        <Field label="Como adaptar">{trend.adaptation_tips}</Field>
        {trend.adaptation_examples?.length > 0 && (
          <Field label="Exemplos por nicho">
            <ul className="space-y-1">
              {trend.adaptation_examples.map((ex, i) => (
                <li key={i}>
                  <span className="font-medium">{ex.niche}:</span> {ex.example}
                </li>
              ))}
            </ul>
          </Field>
        )}
        <div className="flex flex-wrap gap-3">
          <Field label="Formatos">
            <Pills items={trend.content_format} variant="outline" />
          </Field>
          <Field label="Nichos">
            <Pills items={trend.recommended_niches} />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
