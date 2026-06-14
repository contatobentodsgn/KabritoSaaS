/**
 * Tipos inferidos do schema Drizzle (apenas TIPOS — sem runtime, sem conexão).
 * Seguros para importar em qualquer camada de servidor.
 */
import type {
  profiles,
  organizations,
  organizationMembers,
  subscriptions,
  plans,
  platforms,
  contentEditions,
  trendItems,
  exploreReports,
  copyPatterns,
  visualPatterns,
  headlines,
  contentSuggestions,
  promptTemplates,
  promptCategories,
  niches,
  contentTags,
  ingestionSources,
  generationRuns,
  rawSignals,
  userFavorites,
  userSessions,
} from "@/db/schema";

export type Profile = typeof profiles.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type ContentEdition = typeof contentEditions.$inferSelect;
export type TrendItem = typeof trendItems.$inferSelect;
export type ExploreReport = typeof exploreReports.$inferSelect;
export type CopyPattern = typeof copyPatterns.$inferSelect;
export type VisualPattern = typeof visualPatterns.$inferSelect;
export type Headline = typeof headlines.$inferSelect;
export type ContentSuggestion = typeof contentSuggestions.$inferSelect;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type PromptCategory = typeof promptCategories.$inferSelect;
export type Niche = typeof niches.$inferSelect;
export type ContentTag = typeof contentTags.$inferSelect;
export type IngestionSource = typeof ingestionSources.$inferSelect;
export type GenerationRun = typeof generationRuns.$inferSelect;
export type RawSignal = typeof rawSignals.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;

export type StaffRole = "editor" | "superadmin";
