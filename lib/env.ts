/**
 * Variáveis PÚBLICAS (NEXT_PUBLIC_*) — seguras para o client.
 * NUNCA adicione segredos aqui. Segredos ficam em server/env.ts (server-only).
 */
export const publicEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
