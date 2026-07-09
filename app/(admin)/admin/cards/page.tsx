import { listCardFlags } from "@/server/services/admin";
import { canManagePipeline } from "@/server/permissions";
import { DASHBOARD_CARDS } from "@/lib/dashboard-cards";
import { PageHeader } from "@/components/layout/page-header";
import { CardToggle } from "@/components/admin/card-toggle";
import { CardMove } from "@/components/admin/card-move";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Cards do painel · Admin" };

const LABELS: Record<string, string> = Object.fromEntries(
  DASHBOARD_CARDS.map((c) => [c.key, c.label]),
);

export default async function AdminCardsPage() {
  const [flags, canManage] = await Promise.all([
    listCardFlags(),
    canManagePipeline(),
  ]);

  return (
    <>
      <span className="k-eyebrow">Dashboard</span>
      <PageHeader
        title="Cards do painel"
        description="Ligue/desligue e reordene os atalhos do dashboard dos usuários — sem mexer no código."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Visibilidade e ordem dos cards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {flags.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum card configurado. Rode a migração do banco (db:migrate).
            </p>
          )}
          {flags.map((c, i) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {canManage && (
                  <CardMove
                    cardKey={c.key}
                    isFirst={i === 0}
                    isLast={i === flags.length - 1}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {LABELS[c.key] ?? c.key}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={c.enabled ? "success" : "secondary"}>
                  {c.enabled ? "Ativo" : "Oculto"}
                </Badge>
                {canManage && (
                  <CardToggle cardKey={c.key} enabled={c.enabled} />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
