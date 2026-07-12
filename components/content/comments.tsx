import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { CommentForm } from "@/components/content/comment-form";
import { DeleteCommentButton } from "@/components/content/delete-comment-button";
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
 *
 * Server Component (PERF-5): a lista é puramente display — só o form de novo
 * comentário e o botão de excluir de cada card precisam de client (leafs).
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
  return (
    <div className="grid gap-4">
      {initial.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
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
                    {canDelete && <DeleteCommentButton id={c.id} />}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {currentUserId && <CommentForm editionId={editionId} />}
    </div>
  );
}
