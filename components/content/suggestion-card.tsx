import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pills, Field, ScoreBadge, DifficultyBadge } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import { CopyButton } from "@/components/content/copy-button";
import type { ContentSuggestionRow } from "@/types/content";

export function SuggestionCard({
  suggestion,
  favorited,
}: {
  suggestion: ContentSuggestionRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-2">
          <CardTitle>{suggestion.title}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{suggestion.recommended_format}</Badge>
            <DifficultyBadge level={suggestion.difficulty_level} />
            <ScoreBadge score={suggestion.opportunity_score} />
          </div>
        </div>
        <FavoriteButton entityType="content_suggestion" entityId={suggestion.id} initial={favorited} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Ideia central">{suggestion.central_idea}</Field>
        <Field
          label="Headline sugerida"
          action={<CopyButton text={suggestion.suggested_headline} />}
        >
          <span className="italic">&ldquo;{suggestion.suggested_headline}&rdquo;</span>
        </Field>
        <Field
          label="Estrutura do post"
          action={<CopyButton text={suggestion.post_structure} />}
        >
          <p className="whitespace-pre-line">{suggestion.post_structure}</p>
        </Field>
        <Field
          label="Legenda base"
          action={<CopyButton text={suggestion.caption_base} />}
        >
          <p className="whitespace-pre-line">{suggestion.caption_base}</p>
        </Field>
        <Field label="CTA">{suggestion.cta}</Field>
        <CopyButton
          text={`${suggestion.suggested_headline}\n\n${suggestion.caption_base}\n\n${suggestion.cta}`}
          label="Copiar post completo"
        />
        <div className="rounded-lg border border-mint-200 dark:border-forest-800 bg-mint-50 dark:bg-forest-950/40 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="k-eyebrow text-forest-700 dark:text-forest-200">Prompt para adaptar ao seu nicho</p>
            <CopyButton text={suggestion.personalization_prompt} />
          </div>
          <p className="text-sm leading-relaxed">{suggestion.personalization_prompt}</p>
        </div>
        <Pills items={suggestion.recommended_niches} />
      </CardContent>
    </Card>
  );
}
