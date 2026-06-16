import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pills, Field } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import type { CopyPatternRow } from "@/types/content";

export function CopyPatternCard({
  pattern,
  favorited,
}: {
  pattern: CopyPatternRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-2">
          <CardTitle>{pattern.title}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{pattern.category}</Badge>
            <Badge variant="secondary">gatilho: {pattern.trigger_type}</Badge>
            <Badge variant="secondary">{pattern.hook_type}</Badge>
          </div>
        </div>
        <FavoriteButton entityType="copy_pattern" entityId={pattern.id} initial={favorited} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Headline observada">
          <span className="italic">&ldquo;{pattern.observed_headline}&rdquo;</span>
        </Field>
        <Field label="Por que chama atenção">{pattern.explanation}</Field>
        <Field label="Estrutura reutilizável">
          <code className="rounded-sm border border-mint-200 dark:border-forest-800 bg-mint-50 dark:bg-forest-950/40 px-1.5 py-0.5 text-forest-700 dark:text-forest-200">
            {pattern.structure}
          </code>
        </Field>
        {pattern.adaptation_examples?.length > 0 && (
          <Field label="Exemplos por nicho">
            <ul className="space-y-1">
              {pattern.adaptation_examples.map((ex, i) => (
                <li key={i}>
                  <span className="font-medium">{ex.niche}:</span> {ex.example}
                </li>
              ))}
            </ul>
          </Field>
        )}
        <Pills items={pattern.tags} />
      </CardContent>
    </Card>
  );
}
