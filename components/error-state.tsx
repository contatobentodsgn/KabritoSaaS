import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Estado de erro/404 on-brand (mesma linguagem do EmptyState: círculo mint,
 * título serif, copy calma) com slot de ações. Presentacional — serve tanto em
 * Server Components quanto nos error.tsx (client).
 */
export function ErrorState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-mint-100 text-forest-600 dark:bg-forest-900 dark:text-forest-300">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>
        <p className="font-serif text-lg text-foreground">{title}</p>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
