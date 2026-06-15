import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireActiveSubscription, isStaff } from "@/server/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { getEditionWithModules, listNiches } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { listComments } from "@/server/services/comments";
import { PageHeader } from "@/components/layout/page-header";
import { ContentFilters } from "@/components/dashboard/content-filters";
import { SectionTitle, EmptyState } from "@/components/content/empty-state";
import { BriefingCard } from "@/components/content/briefing-card";
import { TrendCard } from "@/components/content/trend-card";
import { ExploreReportCard } from "@/components/content/explore-report-card";
import { CopyPatternCard } from "@/components/content/copy-pattern-card";
import { VisualPatternCard } from "@/components/content/visual-pattern-card";
import { HeadlineCard } from "@/components/content/headline-card";
import { SuggestionCard } from "@/components/content/suggestion-card";
import { Comments } from "@/components/content/comments";

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

  const data = await getEditionWithModules(id);
  if (!data) notFound();

  const [favs, comments, user, canModerate, niches] = await Promise.all([
    getFavoriteKeySet(),
    listComments(id),
    getCurrentUser(),
    isStaff(),
    listNiches(),
  ]);
  const fav = (t: string, i: string) => favs.has(`${t}:${i}`);

  // Lente de nicho: só as seções com recommended_niches são filtradas
  // (Pautas, Headlines, Sugestões). Copy/visual/radar são gerais → ficam intactos.
  const byNiche = <T extends { recommended_niches: string[] }>(arr: T[]): T[] =>
    nicho ? arr.filter((x) => x.recommended_niches?.includes(nicho)) : arr;
  const trends = byNiche(data.trend_items);
  const heads = byNiche(data.headlines);
  const suggestions = byNiche(data.content_suggestions);
  const noNicheItems =
    Boolean(nicho) &&
    trends.length === 0 &&
    heads.length === 0 &&
    suggestions.length === 0;

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
        <ContentFilters niches={niches} />
      </div>

      {data.briefing && <BriefingCard briefing={data.briefing} />}

      {trends.length > 0 && (
        <section id="pautas" className="scroll-mt-20">
          <SectionTitle>Pautas quentes</SectionTitle>
          <div className="grid gap-4">
            {trends.map((t) => (
              <TrendCard key={t.id} trend={t} favorited={fav("trend_item", t.id)} />
            ))}
          </div>
        </section>
      )}

      {data.explore_reports.length > 0 && (
        <section id="radar" className="scroll-mt-20">
          <SectionTitle>Radar de Descoberta</SectionTitle>
          <div className="grid gap-4">
            {data.explore_reports.map((r) => (
              <ExploreReportCard key={r.id} report={r} favorited={fav("explore_report", r.id)} />
            ))}
          </div>
        </section>
      )}

      {data.copy_patterns.length > 0 && (
        <section id="copy" className="scroll-mt-20">
          <SectionTitle>Análise de copy</SectionTitle>
          <div className="grid gap-4">
            {data.copy_patterns.map((c) => (
              <CopyPatternCard key={c.id} pattern={c} favorited={fav("copy_pattern", c.id)} />
            ))}
          </div>
        </section>
      )}

      {data.visual_patterns.length > 0 && (
        <section id="visual" className="scroll-mt-20">
          <SectionTitle>Análise visual</SectionTitle>
          <div className="grid gap-4">
            {data.visual_patterns.map((v) => (
              <VisualPatternCard key={v.id} pattern={v} favorited={fav("visual_pattern", v.id)} />
            ))}
          </div>
        </section>
      )}

      {heads.length > 0 && (
        <section id="headlines" className="scroll-mt-20">
          <SectionTitle>Headlines</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {heads.map((h) => (
              <HeadlineCard key={h.id} headline={h} favorited={fav("headline", h.id)} />
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section id="sugestoes" className="scroll-mt-20">
          <SectionTitle>Sugestões de post</SectionTitle>
          <div className="grid gap-4">
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} favorited={fav("content_suggestion", s.id)} />
            ))}
          </div>
        </section>
      )}

      {!nicho &&
        data.trend_items.length === 0 &&
        data.headlines.length === 0 &&
        data.content_suggestions.length === 0 && (
          <EmptyState title="Edição sem itens" />
        )}

      {noNicheItems && (
        <EmptyState
          title="Nenhuma pauta, headline ou sugestão nesse nicho"
          description="Ajuste o nicho ou limpe o filtro."
        />
      )}

      <section id="comentarios" className="scroll-mt-20">
        <SectionTitle>Comentários</SectionTitle>
        <Comments
          editionId={id}
          initial={comments}
          currentUserId={user?.id}
          canModerate={canModerate}
        />
      </section>
    </>
  );
}
