/**
 * Backup manual do Postgres — mitigação grátis para o plano Supabase Free, que
 * NÃO tem backup automático nem PITR. Rode periodicamente: `npm run db:backup`.
 *
 * O dump é gravado em ~/kabrito-backups/ — FORA do repositório (que é PÚBLICO);
 * dados de usuário NUNCA podem ser versionados. Guarde uma cópia externa
 * (Drive/etc.) de tempos em tempos.
 *
 * Escolhe automaticamente o pg_dump de MAIOR versão disponível (o pg_dump precisa
 * ser >= a versão do servidor Supabase). Procura no PATH e nos caminhos keg do
 * Homebrew (postgresql@17 é keg-only). Override: PG_DUMP=/caminho/pg_dump.
 * Use a conexão DIRETA da Supabase (porta 5432), não o pooler (6543).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL ausente no .env.local.");
  process.exit(1);
}

const candidates = [
  process.env.PG_DUMP,
  "pg_dump", // PATH
  "/opt/homebrew/opt/postgresql@17/bin/pg_dump",
  "/opt/homebrew/opt/libpq/bin/pg_dump",
  "/opt/homebrew/opt/postgresql@16/bin/pg_dump",
  "/usr/local/opt/postgresql@17/bin/pg_dump",
  "/usr/local/opt/libpq/bin/pg_dump",
  "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump",
].filter((c): c is string => !!c);

function majorVersion(bin: string): number | null {
  try {
    const out = execFileSync(bin, ["--version"], {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    const m = out.match(/(\d+)\.\d+/);
    return m?.[1] ? Number(m[1]) : null;
  } catch {
    return null; // não existe / não executável
  }
}

// Escolhe o pg_dump de maior major version disponível.
let best: { bin: string; major: number } | null = null;
for (const bin of candidates) {
  if (bin !== "pg_dump" && !existsSync(bin)) continue;
  const major = majorVersion(bin);
  if (major != null && (!best || major > best.major)) best = { bin, major };
}

if (!best) {
  console.error(
    "❌ pg_dump não encontrado. Instale: brew install postgresql@17",
  );
  process.exit(1);
}

const dir = join(homedir(), "kabrito-backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = join(dir, `kabrito-${stamp}.sql`);

console.log(`Usando ${best.bin} (Postgres ${best.major}) → ${out}`);
const res = spawnSync(
  best.bin,
  [url, "--no-owner", "--no-privileges", "--file", out],
  { stdio: "inherit" },
);

if (res.error) {
  console.error("\n❌ Falha ao executar o pg_dump:", res.error.message);
  process.exit(1);
}
if (res.status !== 0) {
  console.error(
    `\n❌ pg_dump falhou (código ${res.status}).\n` +
      "   • Versão: o pg_dump precisa ser >= o servidor Supabase (hoje Postgres 17).\n" +
      "     Instale o cliente 17:  brew install postgresql@17\n" +
      "     (o script acha o binário keg-only automaticamente; ou aponte com PG_DUMP=/caminho).\n" +
      "   • Conexão: use a DIRETA (Settings → Database → Connection string → URI, porta 5432), não o pooler (6543).\n" +
      '   • Alternativa: Supabase CLI → supabase db dump --db-url "$DATABASE_URL" -f backup.sql',
  );
  process.exit(1);
}

console.log(`\n✅ Backup salvo: ${out}`);
console.log(
  "   Copie para um armazenamento externo (Drive/etc.) periodicamente.",
);
