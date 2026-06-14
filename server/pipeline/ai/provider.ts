import "server-only";
import { serverEnv } from "@/server/env";
import { SYSTEM_BASE, type GenModule, type PromptVars } from "@/server/pipeline/prompts";

/**
 * Provedor de IA do pipeline. Duas implementações:
 *  - RealAnthropicProvider: chama a API da Anthropic (claude) quando AI_API_KEY
 *    está configurada. Exige JSON puro (validado por Zod no generator).
 *  - MockProvider: gera saída determinística e VÁLIDA quando não há chave —
 *    permite rodar e testar o pipeline ponta-a-ponta localmente.
 *
 * Em ambos os casos a saída passa por safeParseGenerated() antes de gravar.
 */

export interface ModelCall {
  raw: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AiProvider {
  name: string;
  model: string;
  generateModule(module: GenModule, userPrompt: string, vars: PromptVars): Promise<ModelCall>;
}

/** Tabela de custo (US$/milhão de tokens). Aproximada; ajuste conforme provider. */
const RATES: Record<string, { in: number; out: number }> = {
  "claude-3-5-sonnet-latest": { in: 3, out: 15 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4 },
  default: { in: 3, out: 15 },
};

export function estimateCostUsd(model: string, inTok: number, outTok: number): number {
  const r = RATES[model] ?? RATES.default!;
  return (inTok / 1_000_000) * r.in + (outTok / 1_000_000) * r.out;
}

/* -------------------------------------------------------------------------- */
class RealAnthropicProvider implements AiProvider {
  name = "anthropic";
  model = serverEnv.AI_MODEL;

  async generateModule(_m: GenModule, userPrompt: string): Promise<ModelCall> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": serverEnv.AI_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: SYSTEM_BASE,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    const raw = data.content.map((c) => c.text ?? "").join("");
    return {
      raw,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  }
}

/* -------------------------------------------------------------------------- */
class MockProvider implements AiProvider {
  name = "mock";
  model = "mock-generator-v1";

  async generateModule(module: GenModule, _userPrompt: string, vars: PromptVars): Promise<ModelCall> {
    // Gatilho de teste: força saída inválida p/ provar que NÃO é gravada.
    if (process.env.PIPELINE_FORCE_INVALID === module) {
      const raw = JSON.stringify({ broken: true });
      return { raw, inputTokens: 100, outputTokens: 50 };
    }
    const raw = JSON.stringify(buildMock(module, vars));
    return { raw, inputTokens: 800, outputTokens: Math.ceil(raw.length / 4) };
  }
}

export function getAiProvider(): AiProvider {
  return serverEnv.AI_API_KEY ? new RealAnthropicProvider() : new MockProvider();
}

/* --------------------------- Mock data builders --------------------------- */
function pickNiches(vars: PromptVars, n = 2): string[] {
  const base = vars.niches.length ? vars.niches : ["marketing", "negocios", "criadores"];
  return base.slice(0, Math.max(1, n));
}
function pickFormats(vars: PromptVars, n = 2): string[] {
  const base = vars.formats.length ? vars.formats : ["carrossel", "reels", "post_unico"];
  return base.slice(0, Math.max(1, n));
}
const SEED = (vars: PromptVars) =>
  (vars.signals || "tendências de conteúdo do dia").slice(0, 80);

function buildMock(module: GenModule, vars: PromptVars): unknown {
  const niches = pickNiches(vars);
  const formats = pickFormats(vars);
  const ex = niches.map((niche) => ({ niche, example: `Aplique ao nicho ${niche} com um gancho forte.` }));
  switch (module) {
    case "briefing":
      return {
        summary: `Resumo do dia para ${vars.platform}: foque no que está em alta. ${SEED(vars)}`,
        whats_growing: ["Conteúdo educativo curto", "Bastidores autênticos"],
        whats_saturated: ["Frases motivacionais genéricas"],
        opportunities: ["Carrosséis com dados", "Reels de tutorial rápido"],
        recommended_formats: formats,
        practical_recommendations: ["Poste cedo", "Use legenda com CTA claro"],
      };
    case "trend_items":
      return [0, 1, 2].map((i) => ({
        title: `Pauta quente ${i + 1} em ${vars.platform}`,
        context: `Contexto da pauta ${i + 1}: o que é e por que surgiu agora. ${SEED(vars)}`,
        why_it_matters: "Importa porque oferece janela de baixa saturação para criadores.",
        adaptation_tips: "Transforme em carrossel: slide 1 gancho, slides 2–4 desenvolvimento, último com CTA.",
        risk_level: "baixo",
        saturation_level: i === 0 ? "emergente" : "baixo",
        opportunity_score: 80 - i * 5,
        content_format: formats,
        recommended_niches: niches,
        adaptation_examples: ex,
      }));
    case "explore_reports":
      return [
        {
          title: "Padrões observados em fontes legais",
          summary: "Análise de ganchos e formatos recorrentes a partir de sinais autorizados.",
          observed_patterns: ["Ganchos de pergunta", "Listas numeradas", "Provas com dados"],
          recommendation: "Combine prova social com um gancho de curiosidade no primeiro segundo.",
        },
      ];
    case "copy_patterns":
      return [0, 1].map((i) => ({
        title: `Padrão de copy ${i + 1}`,
        observed_headline: "Você está fazendo isso do jeito errado",
        category: "quebra_de_crenca",
        hook_type: "pergunta provocativa",
        trigger_type: "curiosidade",
        explanation: "Chama atenção porque desafia uma crença comum do público.",
        structure: "Você está fazendo X do jeito errado",
        adaptation_examples: ex,
        tags: ["copy", "gancho"],
      }));
    case "visual_patterns":
      return [
        {
          title: "Minimalista editorial",
          visual_style: "minimalista editorial",
          colors: ["fundo claro", "texto escuro", "destaque em uma cor"],
          typography_notes: "Tipografia serifada para títulos, sans para corpo.",
          composition_notes: "Bastante respiro, um foco por slide.",
          why_it_works: "Transmite autoridade e facilita a leitura no feed.",
          how_to_adapt: "Use um template fixo de cores e troque só o texto.",
          tags: ["visual", "minimalismo"],
        },
      ];
    case "headlines":
      return [0, 1, 2, 3, 4].map((i) => ({
        headline: `Headline de teste número ${i + 1} que prende atenção`,
        category: "alerta / quebra de padrão",
        trigger_type: ["curiosidade", "medo_de_errar", "prova_social", "novidade", "ganho"][i] ?? "curiosidade",
        why_it_works: "Funciona porque ativa um gatilho emocional específico.",
        adaptations: ["Variação A do título", "Variação B do título"],
        saturation_level: "baixo",
        recommended_niches: niches,
      }));
    case "content_suggestions":
      return [0, 1, 2].map((i) => ({
        title: `Sugestão de post ${i + 1}`,
        central_idea: "Ensinar um conceito difícil de forma simples em poucos slides.",
        recommended_format: formats[0] ?? "carrossel",
        suggested_headline: "O erro que trava seu crescimento",
        post_structure: "Slide 1: gancho. Slides 2–4: passos. Slide final: CTA.",
        caption_base: "Legenda base com contexto, valor e chamada para salvar o post.",
        cta: "Salva esse post para aplicar depois.",
        recommended_niches: niches,
        difficulty_level: "facil",
        opportunity_score: 75 - i * 5,
        personalization_prompt: "Adapte esta ideia para o nicho {seu_nicho} mantendo o gancho.",
      }));
  }
}
