import { requireActiveSubscription } from "@/server/permissions";
import { listTrends } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { TrendCard } from "@/components/content/trend-card";

export const metadata = { title: "Pautas · Inteligência Criativa" };

export default async function TrendsPage() {
  await requireActiveSubscription();
  const [trends, favs] = await Promise.all([listTrends(), getFavoriteKeySet()]);

  return (
    <>
      <PageHeader
        eyebrow="No radar"
        title="Pautas quentes"
        description="As tendências acionáveis do momento, prontas para virar conteúdo."
      />
      {trends.length === 0 ? (
        <EmptyState title="Sem pautas no momento" description="Volte após a próxima edição." />
      ) : (
        <div className="grid gap-4">
          {trends.map((t) => (
            <TrendCard key={t.id} trend={t} favorited={favs.has(`trend_item:${t.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
