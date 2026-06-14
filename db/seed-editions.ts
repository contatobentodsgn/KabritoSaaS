/**
 * Seed de EDIÇÕES DE EXEMPLO (demo): para cada plataforma ativa, gera a edição
 * do dia pelo pipeline e a PUBLICA. É um seeder operacional (rodado a pedido),
 * não o fluxo do app — no app, edições nascem draft e exigem aprovação humana.
 * Usa o provider MOCK se AI_API_KEY não estiver setada.
 *
 * Uso: npm run seed:editions
 */
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { runDailyGeneration } from "@/server/pipeline/run";
import { platforms, contentEditions, plans } from "@/db/schema";

const db = getServiceDbClient();
const date = new Date().toISOString().slice(0, 10);

const actives = await db.select().from(platforms).where(eq(platforms.isActive, true));
const [plan] = await db
  .select({ retentionDays: plans.retentionDays })
  .from(plans)
  .where(eq(plans.isActive, true))
  .limit(1);
const retention = plan?.retentionDays ?? 60;

for (const p of actives) {
  const r = await runDailyGeneration({
    platformId: p.id,
    platformSlug: p.slug,
    editionDate: date,
  });
  if (!r.editionId) {
    console.log(`✗ ${p.slug}: ${r.error ?? "sem edição"}`);
    continue;
  }
  const now = new Date();
  await db
    .update(contentEditions)
    .set({
      status: "published",
      reviewStatus: "approved",
      publishedAt: now,
      contentExpiresAt: new Date(now.getTime() + retention * 86_400_000),
    })
    .where(eq(contentEditions.id, r.editionId));
  console.log(`✓ ${p.slug}: publicada ${r.editionId} ${r.skipped ? "(existente)" : "(nova)"}`);
}

console.log("\nEdições de exemplo prontas.");
process.exit(0);
