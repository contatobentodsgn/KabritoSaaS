"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveEdition, rejectEdition } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ editionId }: { editionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
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
        toast.success("Edição rejeitada. Motivo registrado.");
        router.push("/admin/review");
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={onApprove} disabled={pending}>
          Aprovar e publicar
        </Button>
        <Button
          variant="outline"
          onClick={() => setRejecting((v) => !v)}
          disabled={pending}
        >
          Rejeitar
        </Button>
      </div>
      {rejecting && (
        <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50/50 p-3">
          <Textarea
            placeholder="Motivo da rejeição (vira feedback para ajustar o prompt)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="destructive" size="sm" onClick={onReject} disabled={pending}>
            Confirmar rejeição
          </Button>
        </div>
      )}
    </div>
  );
}
