import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pills, Field } from "@/components/content/shared";
import type { BriefingBlock } from "@/types/content";

export function BriefingCard({ briefing }: { briefing: BriefingBlock }) {
  return (
    <Card className="border-mint-200 bg-mint-50">
      <CardHeader>
        <p className="k-eyebrow text-forest-700">Resumo do dia</p>
        <CardTitle>Briefing do dia</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">{briefing.summary}</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {briefing.whats_growing?.length > 0 && (
          <Field label="Em alta">
            <ul className="list-inside list-disc space-y-1">
              {briefing.whats_growing.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Field>
        )}
        {briefing.whats_saturated?.length > 0 && (
          <Field label="Saturado">
            <ul className="list-inside list-disc space-y-1">
              {briefing.whats_saturated.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Field>
        )}
        {briefing.opportunities?.length > 0 && (
          <Field label="Oportunidades">
            <ul className="list-inside list-disc space-y-1">
              {briefing.opportunities.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Field>
        )}
        {briefing.practical_recommendations?.length > 0 && (
          <Field label="Recomendações práticas">
            <ul className="list-inside list-disc space-y-1">
              {briefing.practical_recommendations.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Field>
        )}
        {briefing.recommended_formats?.length > 0 && (
          <div className="sm:col-span-2">
            <Field label="Formatos recomendados">
              <Pills items={briefing.recommended_formats} />
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
