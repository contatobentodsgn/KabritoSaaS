import "server-only";
import { z } from "zod";
import { serverEnv } from "@/server/env";
import { safeParseGenerated } from "@/server/pipeline/schemas";
import type { CalendarInput } from "@/lib/validations/calendar";

/**
 * "Calendário editorial" — geração SOB DEMANDA (MVP 2).
 * Saída validada por Zod (mesma regra do pipeline: nada cru é exibido).
 * Provider real (Anthropic) quando AI_API_KEY existe; mock determinístico
 * válido caso contrário (permite rodar/testar localmente sem chave).
 * Não toca o banco → não envolve service-client/RLS. pt-BR, sem emoji.
 */
export const calendarDaySchema = z.object({
  day: z.string().trim().min(1).max(40),
  format: z.string().trim().min(2).max(60),
  theme: z.string().trim().min(3).max(160),
  headline: z.string().trim().min(3).max(160),
  hook: z.string().trim().min(3).max(280),
  cta: z.string().trim().min(3).max(160),
});

export const calendarSchema = z.object({
  week_theme: z.string().trim().min(3).max(160),
  days: z.array(calendarDaySchema).min(3).max(7),
});
export type Calendar = z.infer<typeof calendarSchema>;
export type CalendarDay = z.infer<typeof calendarDaySchema>;

const GOAL_LABEL: Record<CalendarInput["goal"], string> = {
  engajar: "gerar engajamento e conversa",
  vender: "converter em vendas",
  educar: "educar e ensinar",
  nutrir: "nutrir e criar relacionamento",
};

const SYSTEM = `Você cria calendários editoriais de social media para um NICHO e PLATAFORMA específicos.
Responda SOMENTE com um objeto JSON válido com as chaves: week_theme (string) e days (array de objetos).
Cada objeto de days tem as chaves: day, format, theme, headline, hook, cta (todas strings).
Não inclua texto fora do JSON, não use crases, não explique. Escreva em português do Brasil, sentence case, sem emoji.
Seja específico e aplicável ao nicho informado; evite generalidades.`;

function buildUser(i: CalendarInput): string {
  return `Nicho do usuário: ${i.niche}
Plataforma: ${i.platform}
Objetivo da semana: ${GOAL_LABEL[i.goal]}
Quantidade de dias: ${i.days}

Crie um calendário editorial com exatamente ${i.days} dias para o nicho "${i.niche}" na plataforma ${i.platform}, com foco em ${GOAL_LABEL[i.goal]}. Devolva:
- week_theme: o tema central da semana;
- days: array com ${i.days} itens, cada um com day (ex.: "Segunda"), format (formato nativo de ${i.platform}), theme (tema do dia), headline (título pronto), hook (gancho de abertura) e cta (chamada para ação).
Saída: JSON conforme o schema.`;
}

async function callAnthropic(user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": serverEnv.AI_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: serverEnv.AI_MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content: { text?: string }[] };
  return data.content.map((c) => c.text ?? "").join("");
}

const WEEKDAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

const FORMAT_BY_PLATFORM: Record<CalendarInput["platform"], string[]> = {
  instagram: ["Carrossel", "Reels", "Post único", "Story"],
  linkedin: ["Post de texto", "Carrossel", "Artigo", "Enquete"],
  threads: ["Thread", "Post único", "Pergunta", "Bastidor"],
  tiktok: ["Vídeo curto", "Tutorial", "Tendência", "Bastidor"],
};

function mockCalendar(i: CalendarInput): string {
  const goal = GOAL_LABEL[i.goal];
  const formats = FORMAT_BY_PLATFORM[i.platform];
  const days = Array.from({ length: i.days }, (_, idx) => {
    const day = WEEKDAYS[idx] ?? `Dia ${idx + 1}`;
    const format = formats[idx % formats.length] ?? "Post único";
    return {
      day,
      format,
      theme: `${day}: ${i.niche} com foco em ${goal}.`.slice(0, 160),
      headline: `O que ninguém te conta sobre ${i.niche}`.slice(0, 160),
      hook: `Se você atua em ${i.niche}, comece este ${format.toLowerCase()} com uma dor real do seu público no primeiro segundo.`.slice(
        0,
        280,
      ),
      cta: `Salve e marque alguém de ${i.niche}.`.slice(0, 160),
    };
  });
  return JSON.stringify({
    week_theme: `Semana de ${i.niche} no ${i.platform}: conteúdo para ${goal}.`.slice(0, 160),
    days,
  });
}

export type CalendarResult =
  | { ok: true; data: Calendar }
  | { ok: false; error: string };

export async function gerarCalendario(input: CalendarInput): Promise<CalendarResult> {
  let raw: string;
  try {
    raw = serverEnv.AI_API_KEY ? await callAnthropic(buildUser(input)) : mockCalendar(input);
  } catch (err) {
    console.error("[calendar] falha na chamada do modelo:", err);
    return { ok: false, error: "Não foi possível gerar o calendário agora. Tente de novo." };
  }
  const parsed = safeParseGenerated(calendarSchema, raw);
  if (!parsed.ok) {
    return { ok: false, error: "A saída não passou na validação. Tente novamente." };
  }
  return { ok: true, data: parsed.data };
}
