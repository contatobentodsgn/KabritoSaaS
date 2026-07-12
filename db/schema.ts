/**
 * db/schema.ts
 * ----------------------------------------------------------------------------
 * Schema Drizzle de REFERÊNCIA para o SaaS (4 domínios):
 *   A) Conteúdo editorial (GLOBAL — sem organization_id)
 *   B) Ingestão / pipeline (interno)
 *   C) Dados de usuário / conta (escopado)
 *   D) Billing (plano único)
 *
 * Observações:
 *  - `user_id` referencia auth.users (schema `auth` do Supabase), que o Drizzle
 *    NÃO gerencia. Por isso guardamos uuid sem FK para auth.users.
 *  - RLS é definida via SQL/migrations no Supabase (ver SECURITY_GUIDE.md §6),
 *    não aqui. Este schema descreve apenas a estrutura das tabelas.
 *  - Ajuste tipos/limites conforme necessário; este é o ponto de partida.
 * ----------------------------------------------------------------------------
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  date,
  numeric,
  unique,
  index,
} from "drizzle-orm/pg-core";

/* ===========================================================================
 * ENUMS
 * =========================================================================== */
export const editionStatus = pgEnum("edition_status", [
  "draft",
  "scheduled",
  "published",
  "archived",
]);
export const reviewStatus = pgEnum("review_status", [
  "pending",
  "in_review",
  "approved",
  "rejected",
]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);
export const staffRole = pgEnum("staff_role", ["editor", "superadmin"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);
export const billingCycle = pgEnum("billing_cycle", ["monthly", "annual"]);
export const riskLevel = pgEnum("risk_level", ["baixo", "medio", "alto"]);
export const saturationLevel = pgEnum("saturation_level", [
  "emergente",
  "baixo",
  "medio",
  "alto",
  "saturado",
]);
export const sourceType = pgEnum("source_type", [
  "api",
  "rss",
  "trends",
  "manual_seed",
]);
export const runStatus = pgEnum("run_status", [
  "started",
  "ingesting",
  "generating",
  "completed",
  "failed",
]);

/* Helper de timestamps */
const ts = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

/* ===========================================================================
 * A) CONTEÚDO EDITORIAL — GLOBAL (sem organization_id)
 * =========================================================================== */

export const platforms = pgTable("platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  ...ts,
});

export const contentEditions = pgTable(
  "content_editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    summary: text("summary"),
    // Briefing diário (briefingSchema) — "coração" da edição. JSONB pois é
    // estrutura rica (listas) sem tabela própria. Validado por Zod no pipeline.
    briefing: jsonb("briefing").$type<{
      summary: string;
      whats_growing: string[];
      whats_saturated: string[];
      opportunities: string[];
      recommended_formats: string[];
      practical_recommendations: string[];
    }>(),
    platformId: uuid("platform_id")
      .references(() => platforms.id)
      .notNull(),
    editionDate: date("edition_date").notNull(),
    status: editionStatus("status").default("draft").notNull(),
    reviewStatus: reviewStatus("review_status").default("pending").notNull(),
    generatedByRunId: uuid("generated_by_run_id"),
    generationPromptVersion: varchar("generation_prompt_version", {
      length: 40,
    }),
    reviewedBy: uuid("reviewed_by"), // staff user_id
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    contentExpiresAt: timestamp("content_expires_at", { withTimezone: true }),
    isArchived: boolean("is_archived").default(false).notNull(),
    ...ts,
  },
  (t) => ({
    // Idempotência da geração diária por plataforma
    uniqEditionPerDay: unique("uniq_edition_platform_date").on(
      t.platformId,
      t.editionDate,
    ),
    statusIdx: index("idx_editions_status").on(t.status),
  }),
);

export const trendItems = pgTable("trend_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  platformId: uuid("platform_id")
    .references(() => platforms.id)
    .notNull(),
  title: text("title").notNull(),
  context: text("context").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  adaptationTips: text("adaptation_tips").notNull(),
  riskLevel: riskLevel("risk_level").notNull(),
  saturationLevel: saturationLevel("saturation_level").notNull(),
  opportunityScore: integer("opportunity_score").notNull(),
  contentFormat: jsonb("content_format").$type<string[]>().notNull(),
  recommendedNiches: jsonb("recommended_niches").$type<string[]>().notNull(),
  adaptationExamples: jsonb("adaptation_examples")
    .$type<{ niche: string; example: string }[]>()
    .notNull(),
  ...ts,
});

export const exploreReports = pgTable("explore_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  platformId: uuid("platform_id")
    .references(() => platforms.id)
    .notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  observedPatterns: jsonb("observed_patterns").$type<string[]>().notNull(),
  recommendation: text("recommendation").notNull(),
  ...ts,
});

export const copyPatterns = pgTable("copy_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  observedHeadline: text("observed_headline").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  hookType: varchar("hook_type", { length: 80 }).notNull(),
  triggerType: varchar("trigger_type", { length: 40 }).notNull(),
  explanation: text("explanation").notNull(),
  structure: text("structure").notNull(),
  adaptationExamples: jsonb("adaptation_examples")
    .$type<{ niche: string; example: string }[]>()
    .notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  ...ts,
});

export const visualPatterns = pgTable("visual_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  visualStyle: varchar("visual_style", { length: 120 }).notNull(),
  colors: jsonb("colors").$type<string[]>().notNull(),
  typographyNotes: text("typography_notes").notNull(),
  compositionNotes: text("composition_notes").notNull(),
  whyItWorks: text("why_it_works").notNull(),
  howToAdapt: text("how_to_adapt").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  ...ts,
});

export const headlines = pgTable("headlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  headline: text("headline").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  triggerType: varchar("trigger_type", { length: 40 }).notNull(),
  whyItWorks: text("why_it_works").notNull(),
  adaptations: jsonb("adaptations").$type<string[]>().notNull(),
  saturationLevel: saturationLevel("saturation_level").notNull(),
  recommendedNiches: jsonb("recommended_niches").$type<string[]>().notNull(),
  ...ts,
});

export const contentSuggestions = pgTable("content_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionId: uuid("edition_id")
    .references(() => contentEditions.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  centralIdea: text("central_idea").notNull(),
  recommendedFormat: varchar("recommended_format", { length: 40 }).notNull(),
  suggestedHeadline: text("suggested_headline").notNull(),
  postStructure: text("post_structure").notNull(),
  captionBase: text("caption_base").notNull(),
  cta: text("cta").notNull(),
  recommendedNiches: jsonb("recommended_niches").$type<string[]>().notNull(),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).notNull(),
  opportunityScore: integer("opportunity_score").notNull(),
  personalizationPrompt: text("personalization_prompt").notNull(),
  ...ts,
});

export const promptCategories = pgTable("prompt_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  description: text("description"),
  ...ts,
});

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .references(() => promptCategories.id)
    .notNull(),
  title: text("title").notNull(),
  objective: text("objective").notNull(),
  whenToUse: text("when_to_use").notNull(),
  requiredInput: jsonb("required_input").$type<string[]>().notNull(),
  promptBody: text("prompt_body").notNull(),
  exampleOutput: text("example_output").notNull(),
  platformId: uuid("platform_id").references(() => platforms.id),
  tags: jsonb("tags").$type<string[]>().notNull(),
  // sem is_premium — plano único
  ...ts,
});

export const niches = pgTable("niches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  description: text("description"),
  ...ts,
});

export const contentTags = pgTable("content_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  ...ts,
});

/* ===========================================================================
 * B) INGESTÃO / PIPELINE — INTERNO
 * =========================================================================== */

export const ingestionSources = pgTable("ingestion_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  type: sourceType("type").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  ...ts,
});

export const generationRuns = pgTable("generation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  editionDate: date("edition_date").notNull(),
  platformId: uuid("platform_id")
    .references(() => platforms.id)
    .notNull(),
  status: runStatus("status").default("started").notNull(),
  promptVersion: varchar("prompt_version", { length: 40 }),
  modelUsed: varchar("model_used", { length: 80 }),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  costEstimate: numeric("cost_estimate", { precision: 10, scale: 4 }),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rawSignals = pgTable("raw_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .references(() => ingestionSources.id)
    .notNull(),
  generationRunId: uuid("generation_run_id").references(
    () => generationRuns.id,
  ),
  platformId: uuid("platform_id").references(() => platforms.id),
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ===========================================================================
 * C) DADOS DE USUÁRIO / CONTA — ESCOPADO
 * =========================================================================== */

/** Preferências de UI do usuário — tudo opcional, cliente decide os defaults. */
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  onboardingSteps?: string[]; // ids dos passos do checklist já completados
}

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(), // -> auth.users (sem FK gerenciada)
  name: varchar("name", { length: 120 }),
  email: varchar("email", { length: 200 }).notNull(),
  avatarUrl: text("avatar_url"),
  staffRole: staffRole("staff_role"), // null = assinante comum
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  preferences: jsonb("preferences")
    .$type<UserPreferences>()
    .notNull()
    .default({}),
  ...ts,
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  ownerId: uuid("owner_id").notNull(), // user_id do dono
  ...ts,
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRole("role").default("member").notNull(),
    ...ts,
  },
  (t) => ({
    uniqMember: unique("uniq_org_member").on(t.organizationId, t.userId),
  }),
);

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    entityType: varchar("entity_type", { length: 40 }).notNull(), // headline | prompt | trend | ...
    entityId: uuid("entity_id").notNull(),
    collectionName: varchar("collection_name", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqFav: unique("uniq_user_favorite").on(
      t.userId,
      t.entityType,
      t.entityId,
    ),
    byUser: index("idx_fav_user").on(t.userId),
  }),
);

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  deviceId: varchar("device_id", { length: 120 }).notNull(),
  sessionTokenHash: text("session_token_hash").notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accessLogs = pgTable("access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  organizationId: uuid("organization_id"),
  action: varchar("action", { length: 80 }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id"),
  userId: uuid("user_id"),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 60 }),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ===========================================================================
 * D) BILLING — PLANO ÚNICO
 * =========================================================================== */

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }),
  priceAnnual: numeric("price_annual", { precision: 10, scale: 2 }),
  billingCycle: billingCycle("billing_cycle").default("monthly").notNull(),
  features: jsonb("features").$type<Record<string, unknown>>(),
  retentionDays: integer("retention_days").default(60).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...ts,
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => plans.id)
    .notNull(),
  customerId: varchar("customer_id", { length: 120 }), // Stripe futuro
  subscriptionStatus: subscriptionStatus("subscription_status")
    .default("trialing")
    .notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  ...ts,
});

/**
 * Eventos do Stripe já PROCESSADOS (idempotência + anti-replay do webhook).
 * Escrita só pelo webhook via service_role; RLS nega o resto. Ver migration 0016.
 */
export const stripeEvents = pgTable("stripe_events", {
  eventId: varchar("event_id", { length: 120 }).primaryKey(),
  type: varchar("type", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ===========================================================================
 * E) COMUNIDADE (MVP 3) — comentários por edição
 * Leitura: assinante ativo numa edição publicada (ou staff). Escrita: o próprio.
 * =========================================================================== */
export const editionComments = pgTable(
  "edition_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    editionId: uuid("edition_id")
      .references(() => contentEditions.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(), // -> auth.users (sem FK gerenciada)
    body: text("body").notNull(),
    authorName: varchar("author_name", { length: 120 }), // denormalizado (RLS de profiles é própria-apenas)
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byEdition: index("idx_comments_edition").on(t.editionId),
  }),
);

/* Convites de equipe (workspace de agência) — pendências por e-mail. */
export const orgInvites = pgTable("org_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  role: memberRole("role").default("member").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  invitedBy: uuid("invited_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
