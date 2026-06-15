import { z } from "zod";

/** Validação de TODA entrada (restrição inegociável: Zod em tudo). */

/**
 * Regra de senha FORTE (cadastro + redefinição): 8+ caracteres, com maiúscula,
 * minúscula e número. Texto da dica em PASSWORD_RULES_HINT (mostrado na UI).
 */
export const PASSWORD_RULES_HINT =
  "Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.";

export const strongPassword = z
  .string()
  .min(8, "Use pelo menos 8 caracteres")
  .max(72, "Senha muito longa")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  // Login NÃO aplica a regra forte (contas antigas podem ter senha legada).
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido"),
  password: strongPassword,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetRequestSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
