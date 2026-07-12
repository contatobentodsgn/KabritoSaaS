import type { z } from "zod";

/**
 * Achata um ZodError na 1ª mensagem de campo — texto acionável (UX-9) em vez
 * do genérico "Entrada inválida.". Cai de volta pro genérico se o schema não
 * tiver mensagem custom no campo que falhou (não expõe o texto padrão do Zod,
 * que vem em inglês — este projeto não tem i18n de erro do Zod configurado).
 */
export function zodErrorMessage(error: z.ZodError): string {
  const first = Object.values(error.flatten().fieldErrors).flat().find(Boolean);
  return first ?? "Entrada inválida.";
}
