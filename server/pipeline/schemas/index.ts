/**
 * Re-export dos schemas Zod de saída da IA (fonte: pipeline/generation-schemas.ts).
 * O pipeline valida TODA saída do modelo com estes schemas (SECURITY_GUIDE §9):
 * saída inválida nunca é gravada crua.
 */
export * from "@/pipeline/generation-schemas";
