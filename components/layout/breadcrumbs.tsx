import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string; // omitido no último item (página atual)
}

/** Trilha de navegação hierárquica — reaproveitada em /admin e no /settings. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
          {item.href ? (
            <Link
              href={item.href}
              className="rounded-sm transition-colors duration-150 hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
