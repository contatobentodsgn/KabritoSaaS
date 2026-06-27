import { listRuns } from "@/server/services/admin";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Runs & custo · Admin" };

const RUN_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  failed: "destructive",
  generating: "warning",
  ingesting: "warning",
  started: "secondary",
};

export default async function RunsPage() {
  const runs = await listRuns();
  const totalCost = runs.reduce((acc, r) => acc + Number(r.cost_estimate ?? 0), 0);

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
            <div className="overflow-x-auto">
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
                  <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-mint-50/60 dark:hover:bg-forest-900/40">
                    <td className="p-3">{r.edition_date}</td>
                    <td className="p-3">
                      <Badge variant={RUN_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {r.model_used ?? "—"} {r.prompt_version ? `· ${r.prompt_version}` : ""}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {r.input_tokens ?? 0} / {r.output_tokens ?? 0}
                    </td>
                    <td className="p-3">{Number(r.cost_estimate ?? 0).toFixed(4)}</td>
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
