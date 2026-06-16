import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-mint-100 text-forest-600">
          <Sparkles className="size-6" strokeWidth={1.5} />
        </span>
        <p className="font-serif text-lg text-foreground">{title}</p>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 font-serif text-xl tracking-tight first:mt-0">
      {children}
    </h2>
  );
}
