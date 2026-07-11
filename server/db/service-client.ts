import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { requireEnv } from "@/server/env";

/**
 * ============================================================================
 * SERVICE CLIENT — conexão DIRETA do Drizzle (service_role / DATABASE_URL).
 * ============================================================================
 *
 * ⚠️  ESTA CONEXÃO IGNORA A RLS POR COMPLETO (roda como dono do banco).
 *
 * Regra dura (PROJECT_MASTER_DOCUMENT §4, SECURITY_GUIDE §3):
 *   Só pode ser importada em código de servidor ISOLADO:
 *     - server/pipeline/**   (pipeline de geração)
 *     - server/admin/**      (rotinas administrativas internas)
 *     - app/api/cron/**      (cron jobs)
 *
 * O ESLint custom config BLOQUEIA o import deste módulo fora dessas pastas.
 * Queries de usuário final SEMPRE passam pelo cliente Supabase (JWT) via
 * @/lib/supabase/server para que a RLS seja a rede de segurança real.
 *
 * `import "server-only"` impede qualquer bundling no client.
 */

let _sql: ReturnType<typeof postgres> | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getConnection() {
  if (_sql && _db) return { sql: _sql, db: _db };
  const url = requireEnv("DATABASE_URL");
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  // `prepare: false` é obrigatório atrás do pooler em modo transação (PgBouncer/
  // Supabase). SSL exigido pelo Supabase; local não usa.
  _sql = postgres(url, {
    prepare: false,
    max: 10,
    ssl: isLocal ? false : "require",
  });
  _db = drizzle(_sql, { schema });
  return { sql: _sql, db: _db };
}

/**
 * Cliente de serviço (Drizzle direto, RLS ignorada). Nome explícito conforme
 * SECURITY_GUIDE §3 para facilitar o code review e a regra de lint.
 */
export function getServiceDbClient(): PostgresJsDatabase<typeof schema> {
  return getConnection().db;
}

export { schema };
