/**
 * CLI do pipeline (dev/local). Roda a geração para uma plataforma/data.
 * Uso:
 *   npm run pipeline:run                      # instagram, hoje
 *   npm run pipeline:run -- linkedin 2026-06-13
 */
import "server-only";
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { platforms } from "@/db/schema";
import { runDailyGeneration } from "@/server/pipeline/run";
import { todayISODate } from "@/server/pipeline/cron";

async function main() {
  const slug = process.argv[2] ?? "instagram";
  const date = process.argv[3] ?? todayISODate();
  const db = getServiceDbClient();
  const [platform] = await db
    .select()
    .from(platforms)
    .where(eq(platforms.slug, slug))
    .limit(1);
  if (!platform) {
    console.error(`Plataforma "${slug}" não encontrada. Rode o seed primeiro.`);
    process.exit(1);
  }
  console.log(`Gerando edição para ${slug} em ${date}...`);
  const result = await runDailyGeneration({
    platformId: platform.id,
    platformSlug: platform.slug,
    editionDate: date,
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
