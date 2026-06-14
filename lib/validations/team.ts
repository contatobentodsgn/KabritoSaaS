import { z } from "zod";

/**
 * Schemas Zod do workspace de agência (Zod em TODA entrada de Server Action).
 * O orgId NUNCA entra aqui: é derivado do contexto autenticado (anti-IDOR,
 * SECURITY_GUIDE §4). Estes schemas validam apenas o que o cliente informa.
 */

/** Convite por e-mail. Papel limitado a admin|member (owner não é atribuível por convite). */
export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["admin", "member"]),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

/** Troca de papel de um membro existente. */
export const setRoleSchema = z.object({
  userId: z.string().uuid("Membro inválido"),
  role: z.enum(["owner", "admin", "member"]),
});
export type SetRoleInput = z.infer<typeof setRoleSchema>;

/** Remoção de um membro. */
export const removeSchema = z.object({
  userId: z.string().uuid("Membro inválido"),
});
export type RemoveInput = z.infer<typeof removeSchema>;
