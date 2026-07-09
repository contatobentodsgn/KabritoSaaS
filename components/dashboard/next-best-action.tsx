import Link from "next/link";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Faixa "Próxima melhor ação" — destaque editorial com um CTA claro. */
export function NextBestAction({
  text,
  href,
  cta = "Ver sugestões",
}: {
  text: string;
  href: string;
  cta?: string;
}) {
  return (
    <Card className="border-forest-200 dark:border-forest-700 bg-forest-50/60 dark:bg-forest-900/60">
      <CardContent className="flex flex-col items-start gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-forest-700 dark:text-forest-200 shadow-k-1">
            <Lightbulb className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">
              Próxima melhor ação
            </h3>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              {text}
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href={href}>
            {cta} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
