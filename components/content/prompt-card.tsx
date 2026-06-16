import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pills, Field } from "@/components/content/shared";
import { FavoriteButton } from "@/components/content/favorite-button";
import { CopyButton } from "@/components/content/copy-button";
import type { PromptTemplateRow } from "@/types/content";

export function PromptCard({
  prompt,
  favorited,
}: {
  prompt: PromptTemplateRow;
  favorited?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{prompt.title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{prompt.objective}</p>
        </div>
        <FavoriteButton entityType="prompt_template" entityId={prompt.id} initial={favorited} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Quando usar">{prompt.when_to_use}</Field>
        {prompt.required_input?.length > 0 && (
          <Field label="O que você precisa fornecer">
            <Pills items={prompt.required_input} variant="outline" />
          </Field>
        )}
        <div className="rounded-lg border border-mint-200 dark:border-forest-800 bg-mint-50 dark:bg-forest-950/40 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="k-eyebrow text-forest-700 dark:text-forest-200">Prompt</p>
            <CopyButton text={prompt.prompt_body} />
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{prompt.prompt_body}</pre>
        </div>
        <Field label="Exemplo de saída">
          <p className="whitespace-pre-line text-muted-foreground">{prompt.example_output}</p>
        </Field>
        <Pills items={prompt.tags} />
      </CardContent>
    </Card>
  );
}
