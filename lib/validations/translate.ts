import { z } from "zod";

/** Entrada da geração sob demanda "Adaptar ao meu nicho" (Zod em tudo). */
export const PLATFORM_OPTIONS = ["instagram", "linkedin", "threads", "tiktok"] as const;
export const FORMAT_OPTIONS = [
  "carrossel",
  "reels",
  "post_unico",
  "story",
  "thread",
  "post_linkedin",
] as const;

export const adaptInputSchema = z.object({
  niche: z.string().trim().min(2, "Informe seu nicho").max(60),
  source: z
    .string()
    .trim()
    .min(5, "Cole a pauta, headline ou ideia que quer adaptar")
    .max(1200, "Texto muito longo"),
  platform: z.enum(PLATFORM_OPTIONS).default("instagram"),
  format: z.enum(FORMAT_OPTIONS).default("carrossel"),
});
export type AdaptInput = z.infer<typeof adaptInputSchema>;
