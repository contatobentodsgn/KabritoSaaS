import {
  runsByPromptVersion,
  reviewOutcomes,
  favoritesByType,
  costSummary,
  type ReviewOutcome,
} from "@/server/admin/analytics";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, SectionTitle } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Analytics de uso · Admin" };

const REVIEW_LABEL: Record<ReviewOutcome["status"], string> = {
  approved: "Aprovadas",
  rejected: "Rejeitadas",
  in_review: "Em revisão",
  pending: "Pendentes",
};

const REVIEW_VARIANT: Record<ReviewOutcome["status"], "success" | "destructive" | "warning" | "secondary"> = {
  approved: "success",
  rejected: "destructive",
  in_review: "warning",
  pending: "secondary",
};

const usd = (n: number) => `US$ ${n.toFixed(4)}`;
const int = (n: number) => n.toLocaleString("pt-BR");
const pct = (part: number, total: number) =>
  total === 0 ? "0%" : `${((part / total) * 100).toFixed(1)}%`;

export default async function AnalyticsPage() {
  const [byVersion, reviews, favorites, cost] = await Promise.all([
    runsByPromptVersion(),
    reviewOutcomes(),
    favoritesByType(),
    costSummary(),
  ]);

  const hasData =
    byVersion.length > 0 ||
    reviews.length > 0 ||
    favorites.length > 0 ||
    cost.completedRuns > 0;

  return (
    <>
      <PageHeader
        eyebrow="Uso"
        title="Analytics de uso"
        description="Agregados de sistema para iterar prompts e leitura editorial. Sem dados pessoais — só números."
      />

      {!hasData ? (
        <EmptyState
          title="Ainda sem sinais de uso"
          description="Assim que o pipeline gerar edições e os assinantes salvarem favoritos, os agregados aparecem aqui."
        />
      ) : (
        <div className="space-y-8">
          {/* Faixa de custo / tokens (StatStrip) */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border p-0 sm:grid-cols-4">
              <Stat label="Custo total (runs completos)" value={usd(cost.totalCostUsd)} />
              <Stat label="Tokens totais" value={int(cost.totalTokens)} />
              <Stat
                label="Tokens entrada / saída"
                value={`${int(cost.totalInputTokens)} / ${int(cost.totalOutputTokens)}`}
              />
              <Stat label="Runs completos" value={int(cost.completedRuns)} />
            </CardContent>
          </Card>

          {/* Runs por versão de prompt — sinal central */}
          <section>
            <SectionTitle>Runs por versão de prompt</SectionTitle>
            <p className="mb-3 max-w-prose text-sm text-muted-foreground">
              Taxa de falha e custo médio por versão são o sinal direto para
              ajustar os prompts.
            </p>
            {byVersion.length === 0 ? (
              <EmptyState title="Sem runs registrados" />
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-mint-50 dark:bg-forest-950/40 text-left">
                      <tr className="[&>th]:k-eyebrow [&>th]:p-3 [&>th]:font-semibold">
                        <th>Versão</th>
                        <th>Total</th>
                        <th>Completos</th>
                        <th>Falhas</th>
                        <th>Taxa de falha</th>
                        <th>Custo médio</th>
                        <th>Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byVersion.map((r) => (
                        <tr
                          key={r.version}
                          className="border-b transition-colors last:border-0 hover:bg-mint-50/60 dark:hover:bg-forest-900/40"
                        >
                          <td className="p-3 font-medium">{r.version}</td>
                          <td className="p-3 text-muted-foreground">{int(r.total)}</td>
                          <td className="p-3 text-muted-foreground">{int(r.completed)}</td>
                          <td className="p-3">
                            {r.failed > 0 ? (
                              <Badge variant="destructive">{int(r.failed)}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={r.failed > 0 ? "warning" : "success"}>
                              {pct(r.failed, r.total)}
                            </Badge>
                          </td>
                          <td className="p-3">{usd(r.avgCostUsd)}</td>
                          <td className="p-3 text-muted-foreground">{int(r.totalTokens)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Revisão editorial */}
          <section>
            <SectionTitle>Resultado da revisão</SectionTitle>
            {reviews.length === 0 ? (
              <EmptyState title="Sem edições para revisar" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {reviews.map((r) => (
                  <Card key={r.status}>
                    <CardContent className="space-y-2 p-5">
                      <Badge variant={REVIEW_VARIANT[r.status]}>
                        {REVIEW_LABEL[r.status]}
                      </Badge>
                      <p className="font-serif text-3xl font-medium tracking-tight">
                        {int(r.total)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Favoritos por tipo (cross-user) */}
          <section>
            <SectionTitle>Favoritos por tipo</SectionTitle>
            <p className="mb-3 max-w-prose text-sm text-muted-foreground">
              O que os assinantes mais salvam — leitura agregada de todo o público.
            </p>
            {favorites.length === 0 ? (
              <EmptyState title="Nenhum favorito ainda" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {favorites.map((f) => (
                  <Card key={f.entityType}>
                    <CardContent className="space-y-2 p-5">
                      <span className="k-eyebrow">{f.entityType}</span>
                      <p className="font-serif text-3xl font-medium tracking-tight">
                        {int(f.total)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="k-eyebrow">{label}</p>
      <p className="mt-1 font-serif text-2xl font-medium tracking-tight">{value}</p>
    </div>
  );
}
