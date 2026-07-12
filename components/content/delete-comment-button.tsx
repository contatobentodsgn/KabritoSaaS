"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteComment } from "@/server/actions/comments";
import { Button } from "@/components/ui/button";

/** Botão de excluir comentário — único pedaço interativo do card (ver Comments). */
export function DeleteCommentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onDelete() {
    start(async () => {
      const res = await deleteComment({ id });
      if (res.ok) {
        toast.success("Comentário excluído");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={pending}
      aria-label="Excluir comentário"
      title="Excluir comentário"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
