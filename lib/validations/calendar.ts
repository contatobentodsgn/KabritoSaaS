import { z } from "zod";

/** Entrada da geração sob demanda "Calendário editorial" (Zod em tudo). */
export const CALENDAR_PLATFORM_OPTIONS = [
  "instagram",
  "linkedin",
  "threads",
  "tiktok",
] as const;
export const CALENDAR_GOAL_OPTIONS = [
  "engajar",
  "vender",
  "educar",
  "nutrir",
] as const;

export const calendarInputSchema = z.object({
  niche: z.string().trim().min(2, "Informe seu nicho").max(60),
  platform: z.enum(CALENDAR_PLATFORM_OPTIONS),
  days: z.coerce.number().int().min(3).max(7).default(5),
  goal: z.enum(CALENDAR_GOAL_OPTIONS).default("engajar"),
});
export type CalendarInput = z.infer<typeof calendarInputSchema>;
