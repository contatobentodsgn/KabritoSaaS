import Link from "next/link";
import { Heart } from "lucide-react";
import { requireActiveSubscription } from "@/server/permissions";
import {
  getFavoritedContent,
  getFavoriteMeta,
  listCollections,
} from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, SectionTitle } from "@/components/content/empty-state";
import { Badge } from "@/components/ui/badge";
import { TrendCard } from "@/components/content/trend-card";
import { ExploreReportCard } from "@/components/content/explore-report-card";
import { CopyPatternCard } from "@/components/content/copy-pattern-card";
import { VisualPatternCard } from "@/components/content/visual-pattern-card";
import { HeadlineCard } from "@/components/content/headline-card";
import { SuggestionCard } from "@/components/content/suggestion-card";
import { PromptCard } from "@/components/content/prompt-card";
import { CollectionPicker } from "@/components/content/collection-picker";
import type { FavoriteEntityType } from "@/lib/constants";

export const metadata = { title: "Favoritos · Inteligência Criativa" };

const GENERAL = "Geral";

/** Um item favoritado renderizável, já resolvido para seu card. */
type FavoriteEntry = {
  entityType: FavoriteEntityType;
  entityId: string;
  collection: string;
  card: React.ReactNode;
};

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  await requireActiveSubscription();
  const [c, meta, collections] = await Promise.all([
    getFavoritedContent(),
    getFavoriteMeta(),
    listCollections(),
  ]);

  if (c.total === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Sua coleção"
          title="Favoritos"
          description="Seus itens salvos, só seus."
        />
        <EmptyState
          icon={Heart}
          title="Nada salvo ainda"
          description="Toque no coração em qualquer pauta, headline, copy ou prompt para salvar aqui."
        />
      </>
    );
  }

  const collectionOf = (
    entityType: FavoriteEntityType,
    entityId: string,
  ): string => meta.get(`${entityType}:${entityId}`)?.trim() || GENERAL;

  // Achata todos os tipos numa lista única, preservando a ordem por tipo e os
  // cards/grids existentes. Cada item carrega o picker para mover de coleção.
  const entries: FavoriteEntry[] = [];
  const wrap = (
    entityType: FavoriteEntityType,
    entityId: string,
    card: React.ReactNode,
  ) => {
    const collection = collectionOf(entityType, entityId);
    const currentName = collection === GENERAL ? null : collection;
    entries.push({
      entityType,
      entityId,
      collection,
      card: (
        <div className="grid gap-3">
          {card}
          <CollectionPicker
            entityType={entityType}
            entityId={entityId}
            current={currentName}
            collections={collections}
          />
        </div>
      ),
    });
  };

  for (const t of c.trend_item)
    wrap("trend_item", t.id, <TrendCard trend={t} favorited />);
  for (const r of c.explore_report)
    wrap("explore_report", r.id, <ExploreReportCard report={r} favorited />);
  for (const p of c.copy_pattern)
    wrap("copy_pattern", p.id, <CopyPatternCard pattern={p} favorited />);
  for (const p of c.visual_pattern)
    wrap("visual_pattern", p.id, <VisualPatternCard pattern={p} favorited />);
  for (const h of c.headline)
    wrap("headline", h.id, <HeadlineCard headline={h} favorited />);
  for (const s of c.content_suggestion)
    wrap(
      "content_suggestion",
      s.id,
      <SuggestionCard suggestion={s} favorited />,
    );
  for (const p of c.prompt_template)
    wrap("prompt_template", p.id, <PromptCard prompt={p} favorited />);

  // Agrupa por coleção; "Geral" sempre primeiro, demais em ordem alfabética.
  const grouped = new Map<string, FavoriteEntry[]>();
  for (const e of entries) {
    const bucket = grouped.get(e.collection);
    if (bucket) bucket.push(e);
    else grouped.set(e.collection, [e]);
  }
  const groupNames = [...grouped.keys()].sort((a, b) => {
    if (a === GENERAL) return -1;
    if (b === GENERAL) return 1;
    return a.localeCompare(b, "pt-BR");
  });

  // Filtro por coleção via ?collection=. Valor inválido cai em "todas".
  const { collection: rawFilter } = await searchParams;
  const activeFilter = rawFilter && grouped.has(rawFilter) ? rawFilter : null;
  const visibleNames = activeFilter ? [activeFilter] : groupNames;

  return (
    <>
      <PageHeader
        eyebrow="Sua coleção"
        title="Favoritos"
        description="Seus itens salvos, só seus."
      />

      {groupNames.length > 1 && (
        <nav
          className="mb-2 flex flex-wrap gap-2"
          aria-label="Filtrar por coleção"
        >
          <Link href="/favorites">
            <Badge variant={activeFilter ? "outline" : "forest"}>Todas</Badge>
          </Link>
          {groupNames.map((name) => (
            <Link
              key={name}
              href={`/favorites?collection=${encodeURIComponent(name)}`}
            >
              <Badge variant={activeFilter === name ? "forest" : "outline"}>
                {name}
                <span className="ml-1.5 opacity-70">
                  {grouped.get(name)!.length}
                </span>
              </Badge>
            </Link>
          ))}
        </nav>
      )}

      {visibleNames.map((name) => (
        <section key={name}>
          <SectionTitle>{name}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {grouped.get(name)!.map((e) => (
              <div key={`${e.entityType}:${e.entityId}`}>{e.card}</div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
