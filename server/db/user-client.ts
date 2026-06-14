/**
 * ============================================================================
 * USER CLIENT — cliente Supabase ligado ao JWT do usuário → RLS APLICADA.
 * ============================================================================
 *
 * Toda leitura/escrita disparada por requisição de usuário final passa por
 * aqui. A RLS do Postgres é a rede de segurança real (SECURITY_GUIDE §3).
 *
 * Este é o ÚNICO cliente de banco permitido fora das pastas isoladas
 * (pipeline/admin/cron). Não importa nenhum segredo de servidor.
 */
import { createClient } from "@/lib/supabase/server";

/** Nome explícito conforme SECURITY_GUIDE §3. */
export async function getUserDbClient() {
  return createClient();
}

export { createClient as getSupabaseServerClient };
