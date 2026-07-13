export function PageHeader({
  eyebrow,
  title,
  titleHint,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Adorno opcional ao lado do título (ex.: GlossaryTerm no 1º uso — SEO-7). */
  titleHint?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow && <p className="k-eyebrow">{eyebrow}</p>}
        <h1 className="flex items-center gap-2 font-serif text-3xl font-medium tracking-tight">
          {title}
          {titleHint}
        </h1>
        {description && (
          <p className="max-w-prose text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
