import { z } from "zod";

/** Validação de TODA entrada (restrição inegociável: Zod em tudo). */

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .max(72, "Senha muito longa"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetRequestSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .max(72, "Senha muito longa"),
});
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
