import Link from "next/link";
import { listReviewQueue } from "@/server/services/admin";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Fila de revisão · Admin" };

const STATUS: Record<string, { label: string; variant: "warning" | "secondary" | "destructive" }> = {
  pending: { label: "Pendente", variant: "warning" },
  in_review: { label: "Em revisão", variant: "secondary" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export default async function ReviewQueuePage() {
  const editions = await listReviewQueue();

  return (
    <>
      <span className="k-eyebrow">Passo humano</span>
      <PageHeader
        title="Fila de revisão"
        description="Nada publica sem a sua aprovação. Revise com calma, edição por edição."
      />
      {editions.length === 0 ? (
        <EmptyState
          title="Nada para revisar agora"
          description="As edições geradas pelo pipeline aparecem aqui como rascunho, prontas para a sua leitura."
        />
      ) : (
        <div className="grid gap-3">
          {editions.map((e) => {
            const s = STATUS[e.review_status] ?? { label: e.review_status, variant: "secondary" as const };
            return (
              <Link key={e.id} href={`/admin/review/${e.id}`} className="group block">
                <Card className="transition-[border-color,box-shadow] duration-150 group-hover:border-rose-200 group-hover:shadow-k-1">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg font-medium leading-tight">{e.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{e.edition_date}</p>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
