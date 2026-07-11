"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addComment, deleteComment } from "@/server/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/content/empty-state";

export interface CommentItem {
  id: string;
  user_id: string;
  body: string;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Avatar público do autor (imagem ou inicial). */
function CommentAvatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-100 dark:bg-forest-800 text-xs font-semibold text-forest-700 dark:text-forest-200">
      {initial}
    </span>
  );
}

/**
 * Comentários da comunidade por edição. Lista (autor "Você"/"Membro" — a RLS de
 * profiles impede ler nomes de terceiros), formulário de novo comentário e botão
 * de excluir nos próprios (ou em todos, se canModerate). Toda mutação passa pela
 * Server Action (RLS valida assinatura/autoria) e dá refresh no servidor.
 */
export function Comments({
  editionId,
  initial,
  currentUserId,
  canModerate,
}: {
  editionId: string;
  initial: CommentItem[];
  currentUserId?: string;
  canModerate: boolean;
}) {
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

  function onDelete(id: string) {
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
    <div className="grid gap-4">
      {initial.length === 0 ? (
        <EmptyState
          title="Ainda sem comentários"
          description="Seja a primeira pessoa a comentar nesta edição."
        />
      ) : (
        <ul className="grid gap-3">
          {initial.map((c) => {
            const mine = !!currentUserId && c.user_id === currentUserId;
            const canDelete = mine || canModerate;
            const displayName = mine ? "Você" : (c.author_name ?? "Membro");
            return (
              <li key={c.id}>
                <Card>
                  <CardContent className="flex items-start gap-3 py-4">
                    <CommentAvatar
                      name={c.author_name ?? displayName}
                      src={c.author_avatar}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {dateFmt.format(new Date(c.created_at))}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                        {c.body}
                      </p>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(c.id)}
                        disabled={pending}
                        aria-label="Excluir comentário"
                        title="Excluir comentário"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {currentUserId && (
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
            <Button
              type="submit"
              disabled={pending || body.trim().length === 0}
            >
              Comentar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
