import { requireActiveSubscription } from "@/server/permissions";
import { listHeadlines, listNiches } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { ContentFilters } from "@/components/dashboard/content-filters";
import { HeadlineCard } from "@/components/content/headline-card";

export const metadata = { title: "Headlines · Inteligência Criativa" };

export default async function HeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ nicho?: string }>;
}) {
  await requireActiveSubscription();
  const [{ nicho }, all, favs, niches] = await Promise.all([
    searchParams,
    listHeadlines(),
    getFavoriteKeySet(),
    listNiches(),
  ]);

  // Headlines não têm formato no schema → só filtra por nicho.
  const headlines = all.filter((h) => !nicho || h.recommended_niches?.includes(nicho));
  const filtering = Boolean(nicho);

  return (
    <>
      <PageHeader
        eyebrow="Ganchos"
        title="Headlines"
        description="Ganchos prontos para adaptar ao seu nicho."
      />
      <div className="mb-4">
        <ContentFilters niches={niches} />
      </div>
      {headlines.length === 0 ? (
        <EmptyState
          title={filtering ? "Nenhuma headline nesse nicho" : "Sem headlines no momento"}
          description={filtering ? "Ajuste o nicho ou limpe o filtro." : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {headlines.map((h) => (
            <HeadlineCard key={h.id} headline={h} favorited={favs.has(`headline:${h.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
