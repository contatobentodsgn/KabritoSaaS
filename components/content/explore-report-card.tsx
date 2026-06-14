import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import type { ExploreReportRow } from "@/types/content";

export function ExploreReportCard({
  report,
  favorited,
}: {
  report: ExploreReportRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{report.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
        </div>
        <FavoriteButton entityType="explore_report" entityId={report.id} initial={favorited} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Padrões observados">
          <ul className="list-inside list-disc space-y-1">
            {report.observed_patterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Field>
        <Field label="Recomendação">{report.recommendation}</Field>
      </CardContent>
    </Card>
  );
}
