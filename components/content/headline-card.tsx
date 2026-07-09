import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pills, Field, SaturationBadge } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import type { HeadlineRow } from "@/types/content";

export function HeadlineCard({
  headline,
  favorited,
}: {
  headline: HeadlineRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-2">
          <p className="font-serif text-lg leading-snug text-foreground">
            {headline.headline}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{headline.category}</Badge>
            <Badge variant="secondary">gatilho: {headline.trigger_type}</Badge>
            <SaturationBadge level={headline.saturation_level} />
          </div>
        </div>
        <FavoriteButton
          entityType="headline"
          entityId={headline.id}
          initial={favorited}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Por que funciona">{headline.why_it_works}</Field>
        {headline.adaptations?.length > 0 && (
          <Field label="Variações">
            <ul className="list-inside list-disc space-y-1">
              {headline.adaptations.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Field>
        )}
        <Pills items={headline.recommended_niches} />
      </CardContent>
    </Card>
  );
}
