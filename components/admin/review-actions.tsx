"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveEdition,
  rejectEdition,
  undoRejectEdition,
} from "@/server/actions/admin/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ editionId }: { editionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  function onApprove() {
    start(async () => {
      const res = await approveEdition(editionId);
      if (res.ok) {
        toast.success("Edição publicada e digest disparado.");
        router.push("/admin/review");
      } else toast.error(res.error);
    });
  }

  function onReject() {
    if (reason.trim().length < 3) {
      toast.error("Descreva o motivo da rejeição.");
      return;
    }
    start(async () => {
      const res = await rejectEdition({ editionId, reason });
      if (res.ok) {
        router.push("/admin/review");
        // Desfazer (UX-5): a Toaster vive no layout raiz, então a ação
        // sobrevive à navegação acima — undoRejectEdition roda mesmo depois
        // deste componente desmontar.
        toast.success("Edição rejeitada. Motivo registrado.", {
          duration: 8000,
          action: {
            label: "Desfazer",
            onClick: () => {
              void undoRejectEdition(editionId).then((undo) => {
                if (undo.ok) {
                  toast.success(
                    "Rejeição desfeita — a edição voltou para a fila.",
                  );
                  router.refresh();
                } else {
                  toast.error(undo.error);
                }
              });
            },
          },
        });
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setConfirming(true);
            setRejecting(false);
          }}
          disabled={pending}
        >
          Aprovar e publicar
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setRejecting((v) => !v);
            setConfirming(false);
          }}
          disabled={pending}
        >
          Rejeitar
        </Button>
      </div>
      {confirming && (
        <div className="space-y-2 rounded-md border border-mint-200 dark:border-forest-800 bg-mint-50/60 dark:bg-forest-950/40 p-3">
          <p className="font-serif text-base text-foreground">
            Publicar e enviar o digest?
          </p>
          {/* A11Y-4: esta caixa herda o Card pai de
              admin/review/[id]/page.tsx, que fica claro (bg-rose-50/60) mesmo
              no dark mode (decisão intencional do UI-9, ver comentário lá).
              dark:bg-forest-950/40 sobre esse fundo claro produz um tom médio
              (~93,116,89) onde --muted-foreground dark (calibrado p/ fundos
              bem escuros) cai pra 2.61:1 — abaixo de AA. dark:text-mint-50
              mede 4.87:1 nesse fundo específico. */}
          <p className="text-sm text-muted-foreground dark:text-mint-50">
            A edição vai ao ar e o e-mail é enviado a todos os assinantes
            ativos. Isso não pode ser desfeito.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onApprove} disabled={pending}>
              Publicar e enviar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {rejecting && (
        <div className="space-y-2 rounded-md border border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-500/15 p-3">
          <Textarea
            placeholder="Motivo da rejeição (vira feedback para ajustar o prompt)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={onReject}
            disabled={pending}
          >
            Confirmar rejeição
          </Button>
        </div>
      )}
    </div>
  );
}
