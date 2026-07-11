import "server-only";
import { z } from "zod";
import { serverEnv } from "@/server/env";
import { safeParseGenerated } from "@/server/pipeline/schemas";
import type { AdaptInput } from "@/lib/validations/translate";
import type { ActionResult } from "@/server/actions/types";

/**
 * "Adaptar ao meu nicho" (Trend Translator) — geração SOB DEMANDA (MVP 2).
 * Saída validada por Zod (mesma regra do pipeline: nada cru é exibido).
 * Provider real (Anthropic) quando AI_API_KEY existe; mock determinístico
 * válido caso contrário (permite rodar/testar localmente sem chave).
 * Não toca o banco → não envolve service-client/RLS. pt-BR, sem emoji.
 */
export const adaptationSchema = z.object({
  adapted_headline: z.string().trim().min(3).max(160),
  central_idea: z.string().trim().min(10).max(600),
  post_structure: z.string().trim().min(10).max(2000),
  caption: z.string().trim().min(10).max(2000),
  cta: z.string().trim().min(3).max(160),
  tips: z.array(z.string().trim().min(3).max(160)).min(1).max(5),
});
export type Adaptation = z.infer<typeof adaptationSchema>;

const SYSTEM = `Você adapta conteúdo de social media para um NICHO específico, mantendo a essência da ideia original.
Responda SOMENTE com um objeto JSON válido com as chaves: adapted_headline, central_idea, post_structure, caption, cta, tips (array de 1 a 5 strings).
Não inclua texto fora do JSON, não use crases, não explique. Escreva em português do Brasil, sentence case, sem emoji.
Seja específico e aplicável ao nicho informado; evite generalidades.`;

function buildUser(i: AdaptInput): string {
  return `Nicho do usuário: ${i.niche}
Plataforma: ${i.platform} | Formato: ${i.format}
Conteúdo base a adaptar:
${i.source}

Adapte o conteúdo acima para o nicho "${i.niche}". Devolva:
- adapted_headline: headline reescrita para o nicho;
- central_idea: a ideia central adaptada (1–3 frases);
- post_structure: estrutura passo a passo / slides para ${i.format};
- caption: legenda pronta para publicar;
- cta: chamada para ação;
- tips: 1 a 5 dicas de adaptação específicas do nicho.
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
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content: { text?: string }[] };
  return data.content.map((c) => c.text ?? "").join("");
}

function mockAdaptation(i: AdaptInput): string {
  const base = i.source.replace(/\s+/g, " ").trim().slice(0, 80);
  return JSON.stringify({
    adapted_headline:
      `${base.charAt(0).toUpperCase() + base.slice(1)} — para ${i.niche}`.slice(
        0,
        160,
      ),
    central_idea: `Traga a ideia "${base}" para a realidade de ${i.niche}, falando a linguagem desse público e usando um exemplo concreto do dia a dia.`,
    post_structure: `Slide 1: gancho conectando "${base}" com uma dor de quem atua em ${i.niche}.\nSlides 2–4: desenvolva em 3 passos práticos com exemplos do nicho.\nSlide final: CTA claro para ${i.format} de ${i.platform}.`,
    caption: `Se você trabalha com ${i.niche}, isto é para você. Adaptei a pauta do dia para o seu contexto: ${base}. Salve este post e aplique ainda esta semana.`,
    cta: `Salve e compartilhe com alguém de ${i.niche}.`,
    tips: [
      `Use um exemplo real de ${i.niche} no primeiro segundo.`,
      "Fale a linguagem do seu público, sem jargão genérico.",
      "Feche com um CTA específico e mensurável.",
    ],
  });
}

export type AdaptResult = ActionResult<{ data: Adaptation }>;

export async function adaptToNiche(input: AdaptInput): Promise<AdaptResult> {
  let raw: string;
  try {
    raw = serverEnv.AI_API_KEY
      ? await callAnthropic(buildUser(input))
      : mockAdaptation(input);
  } catch (err) {
    console.error("[adapt] falha na chamada do modelo:", err);
    return {
      ok: false,
      error: "Não foi possível gerar a adaptação agora. Tente de novo.",
    };
  }
  const parsed = safeParseGenerated(adaptationSchema, raw);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "A saída não passou na validação. Tente novamente.",
    };
  }
  return { ok: true, data: parsed.data };
}
