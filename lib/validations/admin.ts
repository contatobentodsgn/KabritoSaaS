import { z } from "zod";

/** Schemas Zod das entradas do admin (Zod em TODA entrada). */

export const rejectionSchema = z.object({
  editionId: z.string().uuid(),
  reason: z.string().trim().min(3, "Descreva o motivo").max(1000),
});

export const editionEditSchema = z.object({
  editionId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Tabelas de itens editáveis na fila de revisão e os campos de texto liberados. */
export const EDITABLE_ITEM_TABLES = {
  trend_items: ["title", "context", "why_it_matters", "adaptation_tips"],
  explore_reports: ["title", "summary", "recommendation"],
  copy_patterns: ["title", "observed_headline", "explanation", "structure"],
  visual_patterns: ["title", "typography_notes", "composition_notes", "why_it_works", "how_to_adapt"],
  headlines: ["headline", "category", "why_it_works"],
  content_suggestions: ["title", "central_idea", "suggested_headline", "post_structure", "caption_base", "cta"],
} as const;

export type EditableTable = keyof typeof EDITABLE_ITEM_TABLES;

export const itemEditSchema = z.object({
  table: z.enum(
    Object.keys(EDITABLE_ITEM_TABLES) as [EditableTable, ...EditableTable[]],
  ),
  id: z.string().uuid(),
  field: z.string().min(1),
  value: z.string().trim().min(1).max(2000),
});

export const itemDeleteSchema = z.object({
  table: z.enum(
    Object.keys(EDITABLE_ITEM_TABLES) as [EditableTable, ...EditableTable[]],
  ),
  id: z.string().uuid(),
});

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "slug em minúsculas, hífens, sem acento");

export const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["api", "rss", "trends", "manual_seed"]),
  configJson: z.string().trim().default("{}"),
  isActive: z.boolean().default(true),
});

export const platformSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  isActive: z.boolean().default(true),
});

export const nicheSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const tagSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const templateSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  objective: z.string().trim().min(3).max(160),
  whenToUse: z.string().trim().min(3).max(600),
  requiredInput: z.string().trim().default(""), // CSV → array
  promptBody: z.string().trim().min(3).max(2000),
  exampleOutput: z.string().trim().min(3).max(2000),
  tags: z.string().trim().default(""), // CSV → array
});
