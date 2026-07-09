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

// RFC 5321 §4.5.3.1.3 — limite prático de um endereço de e-mail.
const emailField = z
  .string()
  .trim()
  .max(254, "E-mail inválido")
  .email("E-mail inválido");

export const loginSchema = z.object({
  email: emailField,
  // Login NÃO aplica a regra forte (contas antigas podem ter senha legada);
  // ainda assim limita o tamanho do input (defesa contra payload gigante).
  password: z.string().min(1, "Informe a senha").max(200, "Senha muito longa"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: emailField,
  password: strongPassword,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetRequestSchema = z.object({
  email: emailField,
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirme a senha").max(72),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
