import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditionWithModules } from "@/server/services/content";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTitle } from "@/components/content/empty-state";
import { ReviewActions } from "@/components/admin/review-actions";
import { ItemEditor } from "@/components/admin/item-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Revisar edição · Admin" };

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEditionWithModules(id); // staff vê draft via RLS
  if (!data) notFound();

  return (
    <>
      <PageHeader title={data.edition.title} description={`${data.edition.edition_date}`}>
        <Badge variant="forest">{data.edition.status}</Badge>
      </PageHeader>

      <Card className="mb-6 border-rose-200 dark:border-rose-500/40 bg-rose-50/60 shadow-k-1">
        <CardHeader className="pb-3">
          <span className="k-eyebrow text-rose-900 dark:text-blush-200">Decisão</span>
          <CardTitle className="text-lg">Aprovar ou ajustar esta edição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Aprovar publica a edição (status → published), calcula a expiração e
            dispara o e-mail digest. Rejeitar registra o motivo como feedback.
          </p>
          <ReviewActions editionId={data.edition.id} />
        </CardContent>
      </Card>

      {data.briefing && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Briefing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{data.briefing.summary}</p>
          </CardContent>
        </Card>
      )}

      {data.trend_items.length > 0 && (
        <>
          <SectionTitle>Pautas ({data.trend_items.length})</SectionTitle>
          <div className="grid gap-3">
            {data.trend_items.map((t) => (
              <ItemEditor
                key={t.id}
                table="trend_items"
                id={t.id}
                title={t.title}
                fields={[
                  { name: "title", label: "Título", value: t.title },
                  { name: "context", label: "Contexto", value: t.context },
                  { name: "why_it_matters", label: "Por que importa", value: t.why_it_matters },
                  { name: "adaptation_tips", label: "Como adaptar", value: t.adaptation_tips },
                ]}
              />
            ))}
          </div>
        </>
      )}

      {data.headlines.length > 0 && (
        <>
          <SectionTitle>Headlines ({data.headlines.length})</SectionTitle>
          <div className="grid gap-3">
            {data.headlines.map((h) => (
              <ItemEditor
                key={h.id}
                table="headlines"
                id={h.id}
                title={h.headline}
                fields={[
                  { name: "headline", label: "Headline", value: h.headline },
                  { name: "category", label: "Categoria", value: h.category },
                  { name: "why_it_works", label: "Por que funciona", value: h.why_it_works },
                ]}
              />
            ))}
          </div>
        </>
      )}

      {data.copy_patterns.length > 0 && (
        <>
          <SectionTitle>Copy ({data.copy_patterns.length})</SectionTitle>
          <div className="grid gap-3">
            {data.copy_patterns.map((c) => (
              <ItemEditor
                key={c.id}
                table="copy_patterns"
                id={c.id}
                title={c.title}
                fields={[
                  { name: "title", label: "Título", value: c.title },
                  { name: "observed_headline", label: "Headline observada", value: c.observed_headline },
                  { name: "explanation", label: "Explicação", value: c.explanation },
                  { name: "structure", label: "Estrutura", value: c.structure },
                ]}
              />
            ))}
          </div>
        </>
      )}

      {data.content_suggestions.length > 0 && (
        <>
          <SectionTitle>Sugestões ({data.content_suggestions.length})</SectionTitle>
          <div className="grid gap-3">
            {data.content_suggestions.map((s) => (
              <ItemEditor
                key={s.id}
                table="content_suggestions"
                id={s.id}
                title={s.title}
                fields={[
                  { name: "title", label: "Título", value: s.title },
                  { name: "central_idea", label: "Ideia central", value: s.central_idea },
                  { name: "caption_base", label: "Legenda base", value: s.caption_base },
                  { name: "cta", label: "CTA", value: s.cta },
                ]}
              />
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-sm">
        <Link href="/admin/review" className="text-primary hover:underline">
          ← Voltar à fila
        </Link>
      </p>
    </>
  );
}
