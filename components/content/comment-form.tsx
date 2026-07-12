"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addComment } from "@/server/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Formulário de novo comentário — único pedaço interativo abaixo da lista (ver Comments). */
export function CommentForm({ editionId }: { editionId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await addComment({ editionId, body: text });
      if (res.ok) {
        setBody("");
        toast.success("Comentário publicado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Compartilhe sua leitura desta edição"
        disabled={pending}
        aria-label="Novo comentário"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || body.trim().length === 0}>
          Comentar
        </Button>
      </div>
    </form>
  );
}
