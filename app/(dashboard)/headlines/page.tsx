import { requireActiveSubscription } from "@/server/permissions";
import { listHeadlines } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { HeadlineCard } from "@/components/content/headline-card";

export const metadata = { title: "Headlines · Inteligência Criativa" };

export default async function HeadlinesPage() {
  await requireActiveSubscription();
  const [headlines, favs] = await Promise.all([
    listHeadlines(),
    getFavoriteKeySet(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Ganchos"
        title="Headlines"
        description="Ganchos prontos para adaptar ao seu nicho."
      />
      {headlines.length === 0 ? (
        <EmptyState title="Sem headlines no momento" />
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
