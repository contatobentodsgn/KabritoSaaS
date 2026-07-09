/**
 * Verifica as credenciais do Supabase lendo do ambiente (.env.local) — sem
 * imprimir nenhum segredo. Útil após rotacionar senha do banco + JWT (anon /
 * service_role). Uso: npm run check:supabase
 */
import postgres from "postgres";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const DBURL = process.env.DATABASE_URL ?? "";

let fail = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fail++;
};

// 1) DATABASE_URL (senha do banco)
try {
  const isLocal = DBURL.includes("localhost") || DBURL.includes("127.0.0.1");
  const sql = postgres(DBURL, {
    max: 1,
    prepare: false,
    ssl: isLocal ? false : "require",
    onnotice: () => {},
    connect_timeout: 10,
  });
  await sql`select 1 as ok`;
  await sql.end({ timeout: 5 });
  check("DATABASE_URL conecta (senha do banco)", true);
} catch (err) {
  check("DATABASE_URL conecta (senha do banco)", false, (err as Error).message);
}

// 2) anon key (auth/settings deve responder 200)
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: ANON },
  });
  check("anon key válida", res.ok, `HTTP ${res.status}`);
} catch (err) {
  check("anon key válida", false, (err as Error).message);
}

// 3) service_role key (admin endpoint exige service_role)
try {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`,
    {
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    },
  );
  check("service_role key válida", res.ok, `HTTP ${res.status}`);
} catch (err) {
  check("service_role key válida", false, (err as Error).message);
}

console.log(
  fail === 0
    ? "\n✅ Credenciais OK"
    : `\n❌ ${fail} credencial(is) com problema`,
);
process.exit(fail === 0 ? 0 : 1);
