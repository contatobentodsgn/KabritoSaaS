import { z } from "zod";
import { FAVORITE_ENTITY_TYPES } from "@/lib/constants";

/** Validação de entrada para ações de conteúdo/favoritos (Zod em tudo). */

export const favoriteSchema = z.object({
  entityType: z.enum(FAVORITE_ENTITY_TYPES),
  entityId: z.string().uuid("entityId inválido"),
});
export type FavoriteInput = z.infer<typeof favoriteSchema>;

/** Move um favorito para uma coleção. "" => sem coleção (Geral). */
export const favoriteCollectionSchema = z.object({
  entityType: z.enum(FAVORITE_ENTITY_TYPES),
  entityId: z.string().uuid("entityId inválido"),
  collection: z.string().trim().max(60, "Máximo de 60 caracteres"),
});
export type FavoriteCollectionInput = z.infer<typeof favoriteCollectionSchema>;
