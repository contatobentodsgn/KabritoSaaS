import { listReviewQueue } from "@/server/services/admin";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { ReviewQueue } from "@/components/admin/review-queue";

export const metadata = { title: "Fila de revisão · Admin" };

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
          description="As edições geradas automaticamente aparecem aqui como rascunho, prontas para a sua leitura — nada é publicado sem a sua aprovação."
        />
      ) : (
        <ReviewQueue editions={editions} />
      )}
    </>
  );
}
