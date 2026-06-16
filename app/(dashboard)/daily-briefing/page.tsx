import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { requireActiveSubscription } from "@/server/permissions";
import {
  listEditions,
  listPlatforms,
  resolvePlatformSlug,
} from "@/server/services/content";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformSwitcher } from "@/components/dashboard/platform-switcher";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Edição diária · Inteligência Criativa" };

function formatDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function DailyBriefingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  await requireActiveSubscription();
  const { platform: platformParam } = await searchParams;
  const platforms = await listPlatforms();
  const slug = resolvePlatformSlug(platformParam, platforms);
  const editions = await listEditions(slug, 60);

  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        title="Edição diária"
        description="Suas edições anteriores. O conteúdo de hoje fica no Dashboard."
      />

      {platforms.length > 1 && (
        <div className="mb-6">
          <PlatformSwitcher platforms={platforms} current={slug} />
        </div>
      )}

      {editions.length === 0 ? (
        <EmptyState
          title="Nenhuma edição ainda"
          description="As edições publicadas aparecem aqui como histórico."
        />
      ) : (
        <div className="grid gap-3">
          {editions.map((e) => (
            <Link key={e.id} href={`/daily-briefing/${e.id}`} className="group">
              <Card className="transition-shadow duration-150 hover:shadow-k-1">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900 text-forest-700 dark:text-forest-200">
                      <CalendarDays className="size-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{e.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(e.edition_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      publicada
                    </Badge>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
