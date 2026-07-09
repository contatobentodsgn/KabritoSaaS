import { z } from "zod";

/** Validação de entrada para comentários da comunidade (Zod em tudo). */

/** Novo comentário em uma edição. */
export const commentInputSchema = z.object({
  editionId: z.string().uuid("editionId inválido"),
  body: z
    .string()
    .trim()
    .min(1, "Escreva um comentário")
    .max(1000, "Máximo de 1000 caracteres"),
});
export type CommentInput = z.infer<typeof commentInputSchema>;

/** Exclusão de um comentário pelo id (RLS garante autor/staff). */
export const deleteCommentSchema = z.object({
  id: z.string().uuid("id inválido"),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
