import { defineConfig } from "drizzle-kit";

/**
 * Drizzle gerencia APENAS schema/migrations (e o pipeline/admin via service-client).
 * Queries de usuário final NÃO passam por aqui — vão pelo cliente Supabase (JWT)
 * para que a RLS seja aplicada. Ver SECURITY_GUIDE.md §3.
 */
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/kabrito",
  },
  verbose: true,
  strict: true,
});
