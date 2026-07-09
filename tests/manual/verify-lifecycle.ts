/**
 * Verificação MANUAL (Fase 6): lifecycle (arquiva expirados + limpa raw_signals)
 * e enumeração de assinantes do digest. Contra o Postgres local.
 * Uso: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-lifecycle.ts
 */
import { and, eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { runLifecycle } from "@/server/pipeline/lifecycle";
import { getActiveSubscriberEmails } from "@/server/admin/notify";
import {
  contentEditions,
  rawSignals,
  ingestionSources,
  platforms,
} from "@/db/schema";

const db = getServiceDbClient();
let failures = 0;
const check = (label: string, cond: boolean) => {
  console.log(`${cond ? "✅" : "❌"} ${label}`);
  if (!cond) failures++;
};

const [ig] = await db
  .select()
  .from(platforms)
  .where(eq(platforms.slug, "instagram"));
const [source] = await db.select().from(ingestionSources).limit(1);
const past = new Date(Date.now() - 40 * 86_400_000);

// edição publicada já EXPIRADA
const [expired] = await db
  .insert(contentEditions)
  .values({
    title: "Edição expirada (lifecycle test)",
    slug: `expired-${Date.now()}`,
    platformId: ig!.id,
    editionDate: "2026-01-01",
    status: "published",
    reviewStatus: "approved",
    publishedAt: past,
    contentExpiresAt: past,
  })
  .returning({ id: contentEditions.id });

// raw_signal antigo
const [oldSignal] = await db
  .insert(rawSignals)
  .values({
    sourceId: source!.id,
    platformId: ig!.id,
    rawPayload: { text: "antigo" },
    collectedAt: past,
  })
  .returning({ id: rawSignals.id });

const result = await runLifecycle();
console.log("lifecycle result:", result);

const [after] = await db
  .select()
  .from(contentEditions)
  .where(eq(contentEditions.id, expired!.id));
check(
  "edição expirada foi arquivada",
  after?.isArchived === true && after?.status === "archived",
);

const remaining = await db
  .select()
  .from(rawSignals)
  .where(eq(rawSignals.id, oldSignal!.id));
check("raw_signal antigo foi limpo", remaining.length === 0);

const emails = await getActiveSubscriberEmails();
console.log("assinantes ativos (digest):", emails.length);
check(
  "enumeração de assinantes do digest funciona (>=0)",
  Array.isArray(emails),
);

// limpeza do fixture
await db
  .delete(contentEditions)
  .where(and(eq(contentEditions.id, expired!.id)));

console.log(failures === 0 ? "\n✅ LIFECYCLE OK" : `\n❌ ${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
