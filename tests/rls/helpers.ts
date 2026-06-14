import postgres from "postgres";

/**
 * Harness de teste de RLS. Conecta como superuser (postgres) e troca de PAPEL
 * por transação para SIMULAR exatamente o Supabase:
 *   - asUser(uid)   → SET LOCAL ROLE authenticated + request.jwt.claims.sub = uid
 *                     (RLS APLICADA — auth.uid() = uid)
 *   - asAnon()      → SET LOCAL ROLE anon (sem claims)
 *   - asService()   → SET LOCAL ROLE service_role (BYPASSRLS — RLS IGNORADA)
 *
 * É a prova viva da seção 3 do SECURITY_GUIDE: o cliente (authenticated)
 * respeita a RLS; o service_role a ignora.
 */
const url =
  process.env.TEST_DATABASE_URL ??
  "postgres://postgres@localhost:54329/kabrito_test";

export const sql = postgres(url, { max: 4, onnotice: () => {} });

type Tx = postgres.TransactionSql<Record<string, never>>;

export async function asUser<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe("set local role authenticated");
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    return fn(tx);
  }) as unknown as Promise<T>;
}

export async function asAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe("set local role anon");
    await tx`select set_config('request.jwt.claims', '', true)`;
    return fn(tx);
  }) as unknown as Promise<T>;
}

export async function asService<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe("set local role service_role");
    return fn(tx);
  }) as unknown as Promise<T>;
}

export async function closeDb() {
  await sql.end({ timeout: 5 });
}
