import { listRuns } from "@/server/services/admin";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusMapEntry } from "@/components/ui/status-badge";

export const metadata = { title: "Runs & custo · Admin" };

const RUN_STATUS: Record<string, StatusMapEntry> = {
  completed: { label: "completed", variant: "success" },
  failed: { label: "failed", variant: "destructive" },
  generating: { label: "generating", variant: "warning" },
  ingesting: { label: "ingesting", variant: "warning" },
  started: { label: "started", variant: "secondary" },
};

export default async function RunsPage() {
  const runs = await listRuns();
  const totalCost = runs.reduce(
    (acc, r) => acc + Number(r.cost_estimate ?? 0),
    0,
  );

  return (
    <>
      <span className="k-eyebrow">Pipeline</span>
      <PageHeader
        title="Runs de geração & custo"
        description={`Custo total registrado: US$ ${totalCost.toFixed(4)}`}
      />
      {runs.length === 0 ? (
        <EmptyState
          title="Nenhuma geração ainda"
          description="Quando uma edição for gerada, o custo e o histórico de execuções aparecem aqui."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="space-y-3 p-3 sm:hidden">
              {runs.map((r) => (
                <div key={r.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{r.edition_date}</span>
                    <StatusBadge status={r.status} map={RUN_STATUS} />
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Modelo / prompt
                    </span>
                    <span className="text-right text-muted-foreground">
                      {r.model_used ?? "—"}{" "}
                      {r.prompt_version ? `· ${r.prompt_version}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tokens (in/out)
                    </span>
                    <span className="text-muted-foreground">
                      {r.input_tokens ?? 0} / {r.output_tokens ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo (US$)</span>
                    <span>{Number(r.cost_estimate ?? 0).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b bg-mint-50 dark:bg-forest-950/40 text-left">
                  <tr className="[&>th]:k-eyebrow [&>th]:p-3 [&>th]:font-semibold">
                    <th>Data</th>
                    <th>Status</th>
                    <th>Modelo / prompt</th>
                    <th>Tokens (in/out)</th>
                    <th>Custo (US$)</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b transition-colors last:border-0 hover:bg-mint-50/60 dark:hover:bg-forest-900/40"
                    >
                      <td className="p-3">{r.edition_date}</td>
                      <td className="p-3">
                        <StatusBadge status={r.status} map={RUN_STATUS} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {r.model_used ?? "—"}{" "}
                        {r.prompt_version ? `· ${r.prompt_version}` : ""}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {r.input_tokens ?? 0} / {r.output_tokens ?? 0}
                      </td>
                      <td className="p-3">
                        {Number(r.cost_estimate ?? 0).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
