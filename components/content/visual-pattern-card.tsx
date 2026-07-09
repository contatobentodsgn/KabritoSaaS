import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pills, Field } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import type { VisualPatternRow } from "@/types/content";

export function VisualPatternCard({
  pattern,
  favorited,
}: {
  pattern: VisualPatternRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>{pattern.title}</CardTitle>
          <Badge variant="outline">{pattern.visual_style}</Badge>
        </div>
        <FavoriteButton
          entityType="visual_pattern"
          entityId={pattern.id}
          initial={favorited}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Cores">
          <Pills items={pattern.colors} variant="outline" />
        </Field>
        <Field label="Tipografia">{pattern.typography_notes}</Field>
        <Field label="Composição">{pattern.composition_notes}</Field>
        <Field label="Por que funciona">{pattern.why_it_works}</Field>
        <Field label="Como adaptar">{pattern.how_to_adapt}</Field>
        <Pills items={pattern.tags} />
      </CardContent>
    </Card>
  );
}
