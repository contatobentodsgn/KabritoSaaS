/**
 * Seed idempotente: plano único + plataformas (Instagram/LinkedIn/Threads) +
 * nichos + tags + categorias + 1 prompt evergreen + fontes de ingestão (seed
 * manual, RSS, trends, api). Conexão direta (operação administrativa).
 * Uso: npm run db:seed
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray, sql as dsql } from "drizzle-orm";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente.");
const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const client = postgres(url, {
  max: 1,
  onnotice: () => {},
  prepare: false,
  ssl: isLocal ? false : "require",
});
const db = drizzle(client, { schema });

const NICHES = [
  ["Marketing", "marketing"],
  ["Negócios", "negocios"],
  ["Criadores de conteúdo", "criadores"],
  ["Saúde e bem-estar", "saude"],
  ["Finanças pessoais", "financas"],
  ["Educação", "educacao"],
];
const TAGS = [
  ["Copy", "copy"],
  ["Gancho", "gancho"],
  ["Visual", "visual"],
  ["Storytelling", "storytelling"],
];

async function ensureSource(
  name: string,
  type: "rss" | "api" | "trends" | "manual_seed",
  config: Record<string, unknown>,
) {
  const existing = await db
    .select({ id: schema.ingestionSources.id })
    .from(schema.ingestionSources)
    .where(eq(schema.ingestionSources.name, name))
    .limit(1);
  if (existing[0]) return;
  await db.insert(schema.ingestionSources).values({ name, type, config, isActive: true });
}

async function main() {
  await db
    .insert(schema.plans)
    .values({
      name: "Plano Único",
      slug: "plano-unico",
      priceMonthly: "49.00",
      priceAnnual: "470.00",
      billingCycle: "monthly",
      features: { editorial_diaria: true, favoritos: true, prompts: true },
      retentionDays: 60,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.plans.slug });

  // Plataformas — MVP 2 ativa LinkedIn e Threads além do Instagram.
  await db
    .insert(schema.platforms)
    .values([
      { name: "Instagram", slug: "instagram", isActive: true },
      { name: "LinkedIn", slug: "linkedin", isActive: true },
      { name: "Threads", slug: "threads", isActive: true },
      { name: "TikTok", slug: "tiktok", isActive: true },
    ])
    .onConflictDoNothing({ target: schema.platforms.slug });
  // Garante ativo mesmo se já existiam inativos de um seed anterior.
  await db
    .update(schema.platforms)
    .set({ isActive: true })
    .where(inArray(schema.platforms.slug, ["linkedin", "threads", "tiktok"]));

  for (const [name, slug] of NICHES) {
    await db.insert(schema.niches).values({ name: name!, slug: slug! }).onConflictDoNothing({ target: schema.niches.slug });
  }
  for (const [name, slug] of TAGS) {
    await db.insert(schema.contentTags).values({ name: name!, slug: slug! }).onConflictDoNothing({ target: schema.contentTags.slug });
  }

  await db
    .insert(schema.promptCategories)
    .values({ name: "Copywriting", slug: "copywriting", description: "Prompts de copy" })
    .onConflictDoNothing({ target: schema.promptCategories.slug });
  const [cat] = await db
    .select()
    .from(schema.promptCategories)
    .where(eq(schema.promptCategories.slug, "copywriting"))
    .limit(1);
  const promptCount = await db.select({ c: dsql<number>`count(*)` }).from(schema.promptTemplates);
  if (cat && Number(promptCount[0]?.c ?? 0) === 0) {
    await db.insert(schema.promptTemplates).values({
      categoryId: cat.id,
      title: "Gerar 10 ganchos para um tema",
      objective: "Produzir ganchos variados para um tema/post.",
      whenToUse: "Quando você tem o tema mas não sabe como começar o post.",
      requiredInput: ["tema", "nicho"],
      promptBody:
        "Aja como copywriter. Gere 10 ganchos para o tema {tema} no nicho {nicho}, variando os gatilhos (curiosidade, prova social, medo de errar).",
      exampleOutput: "1. Você está fazendo {tema} do jeito errado...\n2. ...",
      tags: ["copy", "gancho"],
    });
  }

  // Fontes de ingestão legais (sem scraping). MVP 2 amplia os conectores.
  await ensureSource("Seed manual do dia", "manual_seed", {
    items: [
      "Carrosséis educativos com dados estão em alta",
      "Reels de bastidores autênticos performam bem",
      "Headlines de quebra de crença geram salvamentos",
    ],
  });
  await ensureSource("Newsletter de marketing (RSS)", "rss", {
    url: "https://example.com/marketing/feed.xml",
  });
  await ensureSource("Termos em alta (Trends)", "trends", {
    terms: ["IA no marketing", "vídeos curtos", "storytelling de marca", "prova social"],
  });
  await ensureSource("API de notícias (exemplo)", "api", {
    url: "https://example.com/api/news",
    path: "articles",
    field: "title",
  });

  console.log("Seed concluído.");
  await client.end();
}

main().catch(async (err) => {
  console.error("Seed falhou:", err);
  await client.end();
  process.exit(1);
});
