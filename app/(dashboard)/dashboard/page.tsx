import Link from "next/link";
import { Flame, Type, Image as ImageIcon, Lightbulb } from "lucide-react";
import { getCurrentProfile } from "@/server/auth/session";
import { hasActiveSubscription } from "@/server/permissions";
import {
  getLatestEdition,
  getEditionWithModules,
  listPlatforms,
  listNiches,
  resolvePlatformSlug,
} from "@/server/services/content";
import { listFavorites } from "@/server/services/favorites";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { PlatformSwitcher } from "@/components/dashboard/platform-switcher";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { ContentFilters } from "@/components/dashboard/content-filters";
import { BriefingSummary } from "@/components/dashboard/briefing-summary";
import { NextBestAction } from "@/components/dashboard/next-best-action";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard · Inteligência Criativa" };

function updatedLabel(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const d = new Date(publishedAt);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? `Atualizado hoje às ${time}`
    : `Atualizado em ${d.toLocaleDateString("pt-BR")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; nicho?: string; formato?: string }>;
}) {
  const [{ platform: platformParam, nicho, formato }, profile, active] =
    await Promise.all([searchParams, getCurrentProfile(), hasActiveSubscription()]);

  const [platforms, niches] = active
    ? await Promise.all([listPlatforms(), listNiches()])
    : [[], []];
  const slug = resolvePlatformSlug(platformParam, platforms);

  // "Lente": o filtro escolhido no dashboard viaja nos atalhos p/ /trends e /headlines.
  const lensParams = new URLSearchParams();
  if (nicho) lensParams.set("nicho", nicho);
  if (formato) lensParams.set("formato", formato);
  const lensQuery = lensParams.toString();

  const latest = active ? await getLatestEdition(slug) : null;
  const [data, favorites] = latest
    ? await Promise.all([getEditionWithModules(latest.id), listFavorites()])
    : [null, []];
  const name = profile?.name ?? "criador";

  return (
    <div className="space-y-6">
      <DashboardHero
        name={name}
        updatedLabel={updatedLabel(latest?.published_at ?? null)}
        active={active}
        hasEdition={!!data}
      />

      {active && (
        <PlatformSwitcher platforms={platforms} current={slug} />
      )}

      {!active && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-900">
              Sua assinatura não está ativa — o conteúdo editorial fica disponível
              com a assinatura ativa.
            </p>
            <Button asChild size="sm" variant="blush">
              <Link href="/settings">Ver assinatura</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {active && !data && (
        <EmptyState
          title="Nenhuma edição publicada ainda"
          description="Assim que a equipe revisar e publicar a edição do dia, o resumo aparece aqui."
        />
      )}

      {active && data && (
        <>
          <StatStrip
            items={[
              { icon: Flame, value: data.trend_items.length, label: "pautas quentes" },
              { icon: Type, value: data.headlines.length, label: "headlines" },
              { icon: ImageIcon, value: data.visual_patterns.length, label: "padrões visuais" },
              { icon: Lightbulb, value: data.content_suggestions.length, label: "sugestões de post" },
            ]}
          />

          <ContentFilters niches={niches} showFormat />

          {data.briefing && (
            <BriefingSummary
              briefing={data.briefing}
              platform={
                data.platform?.name ??
                platforms.find((p) => p.slug === slug)?.name ??
                "Instagram"
              }
            />
          )}

          <NextBestAction
            text="Com base no briefing de hoje, comece pela sugestão de maior oportunidade e adapte ao seu nicho."
            href={`/daily-briefing/${data.edition.id}#sugestoes`}
            cta="Ver sugestões de hoje"
          />

          <QuickAccess
            editionId={data.edition.id}
            lensQuery={lensQuery}
            counts={{
              trends: data.trend_items.length,
              explore: data.explore_reports.length,
              copy: data.copy_patterns.length,
              suggestions: data.content_suggestions.length,
              headlines: data.headlines.length,
              visual: data.visual_patterns.length,
              favorites: favorites.length,
            }}
          />
        </>
      )}
    </div>
  );
}
