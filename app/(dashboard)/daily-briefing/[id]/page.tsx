import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Newspaper, Filter } from "lucide-react";
import { requireActiveSubscription, isStaff } from "@/server/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { getEditionWithModules, listNiches } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { listComments } from "@/server/services/comments";
import { PageHeader } from "@/components/layout/page-header";
import { ContentFilters } from "@/components/dashboard/content-filters";
import { SectionNav } from "@/components/content/section-nav";
import { SectionTitle, EmptyState } from "@/components/content/empty-state";
import { BriefingCard } from "@/components/content/briefing-card";
import { TrendCard } from "@/components/content/trend-card";
import { ExploreReportCard } from "@/components/content/explore-report-card";
import { CopyPatternCard } from "@/components/content/copy-pattern-card";
import { VisualPatternCard } from "@/components/content/visual-pattern-card";
import { HeadlineCard } from "@/components/content/headline-card";
import { SuggestionCard } from "@/components/content/suggestion-card";
import { Comments } from "@/components/content/comments";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Edição · Inteligência Criativa" };

export default async function EditionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nicho?: string }>;
}) {
  await requireActiveSubscription();
  const [{ id }, { nicho }] = await Promise.all([params, searchParams]);

  // Gate estrutural: define o 404 e alimenta o header (título/eyebrow) e a
  // sub-nav, então precisa resolver antes de qualquer HTML sair — igual ao
  // requireActiveSubscription() acima, não é uma "ilha" (PERF-3). { cached:
  // true }: página de assinante lendo edição já publicada — ver doc de
  // getEditionWithModules em server/services/content.ts (PERF-2).
  const data = await getEditionWithModules(id, { cached: true });
  if (!data) notFound();
  // TS não propaga o narrowing de `data` para dentro dos fechos aninhados
  // abaixo (EditionContent) — `edition` fixa o tipo já não-nulo no ponto da
  // declaração para eles capturarem.
  const edition = data;

  // Lente de nicho: só as seções com recommended_niches são filtradas
  // (Pautas, Headlines, Sugestões). Copy/visual/radar são gerais → ficam intactos.
  const byNiche = <T extends { recommended_niches: string[] }>(
    arr: T[],
  ): T[] =>
    nicho ? arr.filter((x) => x.recommended_niches?.includes(nicho)) : arr;
  const trends = byNiche(data.trend_items);
  const heads = byNiche(data.headlines);
  const suggestions = byNiche(data.content_suggestions);
  const noNicheItems =
    Boolean(nicho) &&
    trends.length === 0 &&
    heads.length === 0 &&
    suggestions.length === 0;

  // Sub-nav: só as seções que têm conteúdo (+ comentários sempre). Deriva só
  // de `data`/`nicho`, já resolvidos acima — não precisa de Suspense.
  const sections = [
    trends.length > 0 && { id: "pautas", label: "Pautas" },
    data.explore_reports.length > 0 && { id: "radar", label: "Radar" },
    data.copy_patterns.length > 0 && { id: "copy", label: "Copy" },
    data.visual_patterns.length > 0 && { id: "visual", label: "Visual" },
    heads.length > 0 && { id: "headlines", label: "Headlines" },
    suggestions.length > 0 && { id: "sugestoes", label: "Sugestões" },
    { id: "comentarios", label: "Comentários" },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  // Três ilhas independentes abaixo (fechos locais sobre `data`/`nicho`/etc.,
  // já resolvidos): cada uma busca só o próprio dado e transmite assim que
  // fica pronta, sem travar o shell nem as outras na mais lenta das três.

  /** Ilha 1: filtro de nicho — só depende de `niches`. */
  async function NicheFilters() {
    const niches = await listNiches();
    return <ContentFilters niches={niches} />;
  }

  /** Ilha 2: cards de conteúdo — todos dependem de `favs` (favoritos do
   *  usuário) via o helper `fav()`, então formam uma única ilha coesa em vez
   *  de 6 boundaries que repetiriam a mesma busca. */
  async function EditionContent() {
    const favs = await getFavoriteKeySet();
    const fav = (t: string, i: string) => favs.has(`${t}:${i}`);

    return (
      <>
        {edition.briefing && <BriefingCard briefing={edition.briefing} />}

        {trends.length > 0 && (
          <section id="pautas" className="scroll-mt-20">
            <SectionTitle>Pautas quentes</SectionTitle>
            <div className="grid gap-4">
              {trends.map((t) => (
                <TrendCard
                  key={t.id}
                  trend={t}
                  favorited={fav("trend_item", t.id)}
                />
              ))}
            </div>
          </section>
        )}

        {edition.explore_reports.length > 0 && (
          <section id="radar" className="scroll-mt-20">
            <SectionTitle>Radar de Descoberta</SectionTitle>
            <div className="grid gap-4">
              {edition.explore_reports.map((r) => (
                <ExploreReportCard
                  key={r.id}
                  report={r}
                  favorited={fav("explore_report", r.id)}
                />
              ))}
            </div>
          </section>
        )}

        {edition.copy_patterns.length > 0 && (
          <section id="copy" className="scroll-mt-20">
            <SectionTitle>Análise de copy</SectionTitle>
            <div className="grid gap-4">
              {edition.copy_patterns.map((c) => (
                <CopyPatternCard
                  key={c.id}
                  pattern={c}
                  favorited={fav("copy_pattern", c.id)}
                />
              ))}
            </div>
          </section>
        )}

        {edition.visual_patterns.length > 0 && (
          <section id="visual" className="scroll-mt-20">
            <SectionTitle>Análise visual</SectionTitle>
            <div className="grid gap-4">
              {edition.visual_patterns.map((v) => (
                <VisualPatternCard
                  key={v.id}
                  pattern={v}
                  favorited={fav("visual_pattern", v.id)}
                />
              ))}
            </div>
          </section>
        )}

        {heads.length > 0 && (
          <section id="headlines" className="scroll-mt-20">
            <SectionTitle>Headlines</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {heads.map((h) => (
                <HeadlineCard
                  key={h.id}
                  headline={h}
                  favorited={fav("headline", h.id)}
                />
              ))}
            </div>
          </section>
        )}

        {suggestions.length > 0 && (
          <section id="sugestoes" className="scroll-mt-20">
            <SectionTitle>Sugestões de post</SectionTitle>
            <div className="grid gap-4">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  favorited={fav("content_suggestion", s.id)}
                />
              ))}
            </div>
          </section>
        )}

        {!nicho &&
          edition.trend_items.length === 0 &&
          edition.headlines.length === 0 &&
          edition.content_suggestions.length === 0 && (
            <EmptyState icon={Newspaper} title="Edição sem itens" />
          )}

        {noNicheItems && (
          <EmptyState
            icon={Filter}
            title="Nenhuma pauta, headline ou sugestão nesse nicho"
            description="Ajuste o nicho ou limpe o filtro."
          />
        )}
      </>
    );
  }

  /** Ilha 3: comentários — `comments`/`user`/`canModerate` só alimentam este
   *  bloco, então resolvem juntos num único Promise.all local. */
  async function EditionComments() {
    const [comments, user, canModerate] = await Promise.all([
      listComments(id),
      getCurrentUser(),
      isStaff(),
    ]);
    return (
      <Comments
        editionId={id}
        initial={comments}
        currentUserId={user?.id}
        canModerate={canModerate}
      />
    );
  }

  return (
    <>
      <p className="mb-3">
        <Link
          href="/daily-briefing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Edições anteriores
        </Link>
      </p>
      <PageHeader
        eyebrow={`${data.platform?.name ?? "Instagram"} · ${data.edition.edition_date}`}
        title={data.edition.title}
      />

      <div className="mb-6">
        <Suspense fallback={<NicheFiltersSkeleton />}>
          <NicheFilters />
        </Suspense>
      </div>

      <SectionNav items={sections} />

      <Suspense fallback={<EditionContentSkeleton />}>
        <EditionContent />
      </Suspense>

      <section id="comentarios" className="scroll-mt-20">
        <SectionTitle>Comentários</SectionTitle>
        <Suspense fallback={<CommentsSkeleton />}>
          <EditionComments />
        </Suspense>
      </section>
    </>
  );
}

/** Placeholder do chip de filtro por nicho (formato "pílula" único). */
function NicheFiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-9 w-40 rounded-full" />
    </div>
  );
}

/** Placeholder da zona de cards — mesmo formato "título + grid de cards" do
 *  loading.tsx desta rota, só que menor (ilha única, não a página inteira). */
function EditionContentSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-border bg-card p-5"
              >
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full bg-foreground/[0.07]" />
                <Skeleton className="h-4 w-2/3 bg-foreground/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Placeholder da lista de comentários (título já renderizado fora do
 *  boundary — é chrome estático, não depende de dado nenhum). */
function CommentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="h-3 w-24 bg-foreground/[0.07]" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
