/**
 * Aplica todas as migrations SQL de db/migrations/ em ordem.
 * Usa a conexão direta (DATABASE_URL) — operação administrativa, isolada.
 *
 * Uso: DATABASE_URL=... npm run db:migrate
 */
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente (veja .env.example).");

const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  onnotice: () => {},
  prepare: false, // compatível com o pooler (transaction mode) do Supabase
  ssl: isLocal ? false : "require",
});
const dir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

async function main() {
  // Tabela de tracking: cada migration roda UMA vez (idempotente entre runs).
  await sql.unsafe(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
  const applied = new Set(
    (await sql<{ name: string }[]>`select name from _migrations`).map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const f of files) {
    if (applied.has(f)) {
      console.log(`Skipping ${f} (já aplicada)`);
      continue;
    }
    const content = readFileSync(join(dir, f), "utf8");
    process.stdout.write(`Applying ${f} ... `);
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`insert into _migrations (name) values (${f})`;
    });
    console.log("ok");
    count++;
  }
  await sql.end();
  console.log(`\n${count} migration(s) nova(s) aplicada(s).`);
}

main().catch(async (err) => {
  console.error("Falha na migration:", err);
  await sql.end();
  process.exit(1);
});
