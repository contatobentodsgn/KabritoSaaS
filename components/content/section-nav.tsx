/**
 * Sub-navegação por âncoras das seções de uma edição longa. Server component —
 * são só links de âncora (#pautas, #sugestoes, …), zero JS. Fica grudada logo
 * abaixo do header do app (sticky) e rola horizontalmente no mobile.
 */
export function SectionNav({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-label="Seções da edição"
      className="sticky top-0 z-10 -mx-6 mb-6 overflow-x-auto border-b border-border bg-background/85 px-6 py-2 backdrop-blur"
    >
      <ul className="flex gap-1.5">
        {items.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="inline-flex whitespace-nowrap rounded-full border border-mint-200 bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-forest-300 hover:text-foreground dark:border-forest-800 dark:hover:border-forest-600"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
