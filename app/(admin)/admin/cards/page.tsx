import { listCardFlags } from "@/server/services/admin";
import { canManagePipeline } from "@/server/permissions";
import { DASHBOARD_CARDS } from "@/lib/dashboard-cards";
import { PageHeader } from "@/components/layout/page-header";
import { CardToggle } from "@/components/admin/card-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Cards do painel · Admin" };

export default async function AdminCardsPage() {
  const [flags, canManage] = await Promise.all([listCardFlags(), canManagePipeline()]);

  return (
    <>
      <span className="k-eyebrow">Dashboard</span>
      <PageHeader
        title="Cards do painel"
        description="Ligue/desligue os atalhos que aparecem no dashboard dos usuários — sem mexer no código."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visibilidade dos cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DASHBOARD_CARDS.map((c) => {
            // Sem linha no banco = tratado como ativo (default da tabela).
            const enabled = flags[c.key] ?? true;
            return (
              <div
                key={c.key}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={enabled ? "success" : "secondary"}>
                    {enabled ? "Ativo" : "Oculto"}
                  </Badge>
                  {canManage && <CardToggle cardKey={c.key} enabled={enabled} />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
