import { Flame } from "lucide-react";
import { requireActiveSubscription } from "@/server/permissions";
import { listTrends, listNiches } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { ContentFilters } from "@/components/dashboard/content-filters";
import { TrendCard } from "@/components/content/trend-card";

export const metadata = { title: "Pautas · Inteligência Criativa" };

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ nicho?: string; formato?: string }>;
}) {
  await requireActiveSubscription();
  const [{ nicho, formato }, all, favs, niches] = await Promise.all([
    searchParams,
    listTrends(),
    getFavoriteKeySet(),
    listNiches(),
  ]);

  const trends = all.filter(
    (t) =>
      (!nicho || t.recommended_niches?.includes(nicho)) &&
      (!formato || t.content_format?.includes(formato)),
  );
  const filtering = Boolean(nicho || formato);

  return (
    <>
      <PageHeader
        eyebrow="No radar"
        title="Pautas quentes"
        description="As tendências acionáveis do momento, prontas para virar conteúdo."
      />
      <div className="mb-4">
        <ContentFilters niches={niches} showFormat />
      </div>
      {trends.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={
            filtering
              ? "Nenhuma pauta com esses filtros"
              : "Sem pautas no momento"
          }
          description={
            filtering
              ? "Ajuste o nicho/formato ou limpe os filtros."
              : "Volte após a próxima edição."
          }
        />
      ) : (
        <div className="grid gap-4">
          {trends.map((t) => (
            <TrendCard
              key={t.id}
              trend={t}
              favorited={favs.has(`trend_item:${t.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
