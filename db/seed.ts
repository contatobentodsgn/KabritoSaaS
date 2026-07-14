/**
 * Seed idempotente: plano único + plataformas (Instagram/LinkedIn/Threads/
 * TikTok) + nichos + tags + categorias + 1 prompt evergreen + fontes de
 * ingestão (seed manual, RSS, trends, api) + um CONJUNTO DE DADOS DE DEMO
 * (edições/tendências/headlines/padrões/sugestões/comentários) para testar a
 * UI com volume e variedade reais — sem depender do pipeline de IA.
 * Uso: npm run db:seed
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql as dsql } from "drizzle-orm";
import * as schema from "./schema";
import type { BriefingBlock } from "@/types/content";

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
  ["CTA", "cta"],
  ["Dados", "dados"],
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
  await db
    .insert(schema.ingestionSources)
    .values({ name, type, config, isActive: true });
}

/* ===========================================================================
 * DADOS DE DEMO — edições + módulos de conteúdo, para a UI (dashboard, fila
 * de revisão, tendências, headlines, comentários) ter volume/variedade reais
 * em dev, sem depender do pipeline de IA nem de AI_API_KEY.
 * =========================================================================== */

type TrendItemInput = Omit<
  typeof schema.trendItems.$inferInsert,
  "id" | "editionId" | "platformId" | "createdAt" | "updatedAt"
>;
type HeadlineInput = Omit<
  typeof schema.headlines.$inferInsert,
  "id" | "editionId" | "createdAt" | "updatedAt"
>;
type CopyPatternInput = Omit<
  typeof schema.copyPatterns.$inferInsert,
  "id" | "editionId" | "createdAt" | "updatedAt"
>;
type VisualPatternInput = Omit<
  typeof schema.visualPatterns.$inferInsert,
  "id" | "editionId" | "createdAt" | "updatedAt"
>;
type ContentSuggestionInput = Omit<
  typeof schema.contentSuggestions.$inferInsert,
  "id" | "editionId" | "createdAt" | "updatedAt"
>;
type ExploreReportInput = Omit<
  typeof schema.exploreReports.$inferInsert,
  "id" | "editionId" | "platformId" | "createdAt" | "updatedAt"
>;

interface DemoEdition {
  platformSlug: "instagram" | "linkedin" | "threads" | "tiktok";
  editionDate: string;
  title: string;
  slug: string;
  summary: string;
  status: "draft" | "scheduled" | "published" | "archived";
  reviewStatus: "pending" | "in_review" | "approved" | "rejected";
  publishedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  contentExpiresAt?: Date;
  isArchived?: boolean;
  briefing: BriefingBlock;
  trendItems: TrendItemInput[];
  headlines: HeadlineInput[];
  copyPatterns?: CopyPatternInput[];
  visualPatterns?: VisualPatternInput[];
  contentSuggestions?: ContentSuggestionInput[];
  exploreReports?: ExploreReportInput[];
  comments?: { authorName: string; body: string }[];
}

const now = new Date();
function isoDate(offsetDays: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(offsetDays: number): Date {
  return new Date(now.getTime() + offsetDays * 86_400_000);
}

const ex = (niche: string, example: string) => ({ niche, example });

const DEMO_EDITIONS: DemoEdition[] = [
  /* ------------------------------- INSTAGRAM ------------------------------- */
  {
    platformSlug: "instagram",
    editionDate: isoDate(0),
    title: "Briefing Instagram — carrosséis com dados na frente",
    slug: `briefing-instagram-${isoDate(0)}`,
    summary:
      "O que está em alta hoje no Instagram, do jeito que dá pra aplicar amanhã.",
    status: "published",
    reviewStatus: "approved",
    publishedAt: daysFromNow(0),
    reviewedAt: daysFromNow(0),
    contentExpiresAt: daysFromNow(60),
    briefing: {
      summary:
        "Carrosséis educativos com dados seguem crescendo em salvamentos; reels de bastidores autênticos mantêm alcance estável. Frases motivacionais genéricas estão saturadas — evite abrir com elas.",
      whats_growing: [
        "Carrosséis educativos com dados e fontes citadas",
        "Reels de bastidores autênticos (processo, não produto pronto)",
      ],
      whats_saturated: [
        "Frases motivacionais genéricas sem contexto",
        "Textão de storytelling sem gancho nos primeiros 3 segundos",
      ],
      opportunities: [
        "Carrossel comparando 'antes/depois' com números reais",
        "Reels de tutorial rápido (menos de 30s) com legenda didática",
      ],
      recommended_formats: ["carrossel", "reels"],
      practical_recommendations: [
        "Abra o carrossel com um dado concreto, não uma pergunta genérica",
        "Grave o reels na horizontal do processo real, sem cortar o 'erro'",
      ],
    },
    trendItems: [
      {
        title: "Carrosséis com dados batem reels em taxa de salvamento",
        context:
          "Perfis de nicho vêm publicando carrosséis com estatísticas simples (1 dado por slide) e observando taxa de salvamento acima da média do feed.",
        whyItMatters:
          "Salvamento pesa no algoritmo tanto quanto compartilhamento, e é mais fácil de conseguir com conteúdo educativo bem estruturado.",
        adaptationTips:
          "Slide 1: gancho com o dado mais chocante. Slides 2–4: contexto e explicação. Último slide: resumo + CTA para salvar.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 82,
        contentFormat: ["carrossel"],
        recommendedNiches: ["marketing", "criadores"],
        adaptationExamples: [
          ex(
            "marketing",
            "Carrossel: '3 dados que provam que seu CTA está fraco'.",
          ),
          ex(
            "criadores",
            "Carrossel: '3 números que todo criador iniciante ignora'.",
          ),
        ],
      },
      {
        title: "Reels de bastidores autênticos seguram o alcance",
        context:
          "Reels mostrando o processo real (gravação, erros, retrabalho) performam melhor que reels 100% editados quando a legenda reforça a autenticidade.",
        whyItMatters:
          "O público está saturado de conteúdo polido demais; bastidores geram identificação e comentários.",
        adaptationTips:
          "Grave 15–20s do 'antes' e 10s do resultado. Legenda contando o que deu errado no meio do processo.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 74,
        contentFormat: ["reels"],
        recommendedNiches: ["criadores", "negocios"],
        adaptationExamples: [
          ex(
            "criadores",
            "Reels: 'gravei isso 4 vezes até sair do jeito certo'.",
          ),
        ],
      },
      {
        title: "Textão de storytelling sem gancho está saturado",
        context:
          "Legendas longas que só 'engatam' no 3º parágrafo estão perdendo retenção — o público rola antes de chegar no ponto.",
        whyItMatters:
          "Vale como alerta de risco: reaproveitar esse formato sem ajuste reduz alcance.",
        adaptationTips:
          "Se for usar textão, coloque a virada da história na primeira frase, não no fim.",
        riskLevel: "medio",
        saturationLevel: "saturado",
        opportunityScore: 38,
        contentFormat: ["post_unico"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [
          ex(
            "negocios",
            "Abra com: 'Perdi um cliente grande por causa disso' antes de contar a história.",
          ),
        ],
      },
    ],
    headlines: [
      {
        headline: "O erro de carrossel que está te custando salvamentos",
        category: "alerta / quebra de padrão",
        triggerType: "medo_de_errar",
        whyItWorks:
          "Ativa medo de estar fazendo errado algo que parece básico, gerando cliques defensivos.",
        adaptations: [
          "O erro de legenda que está te custando alcance",
          "O erro de horário que está te custando engajamento",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["marketing", "criadores"],
      },
      {
        headline: "3 dados que provam que seu conteúdo educativo está fraco",
        category: "prova com números",
        triggerType: "prova_social",
        whyItWorks:
          "Números concretos aumentam credibilidade e reduzem a sensação de 'só opinião'.",
        adaptations: [
          "3 dados que provam que seu CTA está fraco",
          "3 dados que provam que seu horário de postagem está errado",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["marketing"],
      },
      {
        headline: "Por que criadores estão abandonando o textão em 2026",
        category: "novidade / mudança de comportamento",
        triggerType: "novidade",
        whyItWorks:
          "Sinaliza uma mudança de comportamento coletivo, criando urgência de não ficar para trás.",
        adaptations: [
          "Por que ninguém mais está usando frases motivacionais soltas",
          "Por que carrossel com dados está substituindo o textão",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["criadores"],
      },
      {
        headline:
          "Testei bastidor sem edição por 7 dias — o resultado surpreendeu",
        category: "estudo de caso pessoal",
        triggerType: "curiosidade",
        whyItWorks:
          "Formato 'testei por X dias' gera curiosidade sobre o resultado sem entregar de cara.",
        adaptations: [
          "Testei carrossel de dados por 7 dias — o resultado surpreendeu",
          "Postei sem legenda longa por 7 dias — o que aconteceu",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["criadores", "negocios"],
      },
      {
        headline: "O carrossel que triplicou meus salvamentos em uma semana",
        category: "resultado / ganho",
        triggerType: "ganho",
        whyItWorks:
          "Promessa de resultado mensurável, específico e recente aumenta o clique.",
        adaptations: [
          "O reels que dobrou meu alcance em uma semana",
          "A legenda que triplicou meus comentários",
        ],
        saturationLevel: "medio",
        recommendedNiches: ["marketing", "criadores"],
      },
    ],
    copyPatterns: [
      {
        title: "Quebra de crença com dado",
        observedHeadline: "Você está fazendo carrossel do jeito errado",
        category: "quebra_de_crenca",
        hookType: "afirmação provocativa",
        triggerType: "curiosidade",
        explanation:
          "Desafia uma prática comum ('carrossel do jeito X') e promete corrigir, gerando abertura garantida.",
        structure: "Você está fazendo [prática comum] do jeito errado",
        adaptationExamples: [
          ex("marketing", "Você está abrindo seu carrossel do jeito errado"),
          ex("criadores", "Você está gravando bastidor do jeito errado"),
        ],
        tags: ["copy", "gancho"],
      },
      {
        title: "Contagem regressiva de dados",
        observedHeadline: "3 dados que provam isso",
        category: "prova_com_numeros",
        hookType: "lista numerada",
        triggerType: "prova_social",
        explanation:
          "Números concretos no início reduzem a sensação de opinião vazia e aumentam a credibilidade percebida.",
        structure: "[N] dados que provam [afirmação polêmica]",
        adaptationExamples: [
          ex("negocios", "3 dados que provam que seu preço está errado"),
        ],
        tags: ["copy", "dados"],
      },
    ],
    visualPatterns: [
      {
        title: "Carrossel dado-por-slide",
        visualStyle: "minimalista editorial",
        colors: ["fundo claro", "texto escuro", "um destaque em cor de marca"],
        typographyNotes:
          "Número do dado em fonte grande no topo do slide; explicação curta abaixo em fonte menor.",
        compositionNotes:
          "Um dado por slide, muito respiro, sem mais de 2 linhas de texto por slide.",
        whyItWorks:
          "Facilita leitura rápida no feed e reforça a sensação de prova concreta.",
        howToAdapt:
          "Use um template fixo (Canva/Figma) e troque só o número e a frase a cada semana.",
        tags: ["visual", "dados", "carrossel"],
      },
    ],
    contentSuggestions: [
      {
        title: "Carrossel: 3 dados que sua audiência não sabe",
        centralIdea:
          "Ensinar um conceito técnico do nicho usando 3 dados curiosos, um por slide.",
        recommendedFormat: "carrossel",
        suggestedHeadline: "3 dados que sua audiência não sabe sobre isso",
        postStructure:
          "Slide 1: dado mais chocante como gancho. Slides 2–3: os outros 2 dados com contexto. Slide 4: resumo + CTA de salvar.",
        captionBase:
          "Legenda curta reforçando o dado do slide 1 e convidando a salvar para consultar depois.",
        cta: "Salva esse post pra consultar quando for planejar seu próximo conteúdo.",
        recommendedNiches: ["marketing", "criadores"],
        difficultyLevel: "facil",
        opportunityScore: 78,
        personalizationPrompt:
          "Adapte os 3 dados para a realidade do nicho {seu_nicho}, mantendo o gancho do slide 1.",
      },
      {
        title: "Reels de bastidor com 'o que deu errado'",
        centralIdea:
          "Mostrar o processo real por trás de um resultado, incluindo o erro do meio do caminho.",
        recommendedFormat: "reels",
        suggestedHeadline: "Gravei isso 4 vezes até sair do jeito certo",
        postStructure:
          "0–5s: mostra o erro. 5–15s: a correção. 15–20s: resultado final.",
        captionBase:
          "Legenda contando em 2 frases o que deu errado e o que você aprendeu com isso.",
        cta: "Comenta aqui se você também já passou por isso.",
        recommendedNiches: ["criadores"],
        difficultyLevel: "medio",
        opportunityScore: 70,
        personalizationPrompt:
          "Troque o exemplo de erro pelo mais comum no seu processo dentro de {seu_nicho}.",
      },
      {
        title: "Post único de contra-intuição com fonte",
        centralIdea:
          "Apresentar uma afirmação contra-intuitiva sobre o nicho, sustentada por uma fonte citável.",
        recommendedFormat: "post_unico",
        suggestedHeadline:
          "O que todo mundo recomenda pode estar te atrapalhando",
        postStructure:
          "Frase de abertura contra-intuitiva, 2 frases de explicação, 1 fonte citada, CTA de opinião.",
        captionBase: "Legenda direta, sem enrolação, citando a fonte no final.",
        cta: "Concorda ou discorda? Comenta.",
        recommendedNiches: ["negocios", "marketing"],
        difficultyLevel: "dificil",
        opportunityScore: 60,
        personalizationPrompt:
          "Substitua a afirmação contra-intuitiva por uma específica do seu nicho {seu_nicho}, com fonte real.",
      },
    ],
    exploreReports: [
      {
        title: "Padrões observados em fontes legais (Instagram)",
        summary:
          "Análise de ganchos e formatos recorrentes a partir de fontes autorizadas (RSS de marketing/redes sociais).",
        observedPatterns: [
          "Ganchos com dado numérico no slide 1",
          "Bastidores com narrativa de erro-e-acerto",
          "Textão perdendo espaço para formatos mais curtos",
        ],
        recommendation:
          "Priorize carrossel com dado no gancho e reels de bastidor nesta semana; evite abrir com frase motivacional solta.",
      },
    ],
    comments: [
      {
        authorName: "Marina Costa",
        body: "Testei o carrossel de dados essa semana e o salvamento realmente subiu. Valeu pela dica!",
      },
      {
        authorName: "Rafael Nunes",
        body: "Alguém mais sentiu que o reels de bastidor performa melhor quando é bem cru mesmo, sem edição pesada?",
      },
      {
        authorName: "Bianca Ferreira",
        body: "Achei o exemplo de headline com 'erro' bem forte, mas cuidado pra não parecer clickbait vazio.",
      },
    ],
  },
  {
    platformSlug: "instagram",
    editionDate: isoDate(-1),
    title: "Briefing Instagram — rascunho aguardando revisão",
    slug: `briefing-instagram-${isoDate(-1)}`,
    summary: "Gerado automaticamente, ainda não revisado por um editor.",
    status: "draft",
    reviewStatus: "pending",
    briefing: {
      summary:
        "Sinais do dia apontam para reels educativos curtos e carrosséis de comparação.",
      whats_growing: ["Reels educativos abaixo de 30s"],
      whats_saturated: ["Carrossel de citação sem contexto"],
      opportunities: ["Carrossel comparando dois métodos lado a lado"],
      recommended_formats: ["reels", "carrossel"],
      practical_recommendations: ["Teste thumbnail com texto curto no reels"],
    },
    trendItems: [
      {
        title: "Reels educativos abaixo de 30s ganham prioridade",
        context:
          "Reels mais curtos (menos de 30s) estão sendo assistidos até o fim com mais frequência que os longos.",
        whyItMatters:
          "Assistir até o fim é um dos sinais mais fortes para o algoritmo priorizar alcance.",
        adaptationTips:
          "Corte qualquer introdução; comece já explicando o ponto principal.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 71,
        contentFormat: ["reels"],
        recommendedNiches: ["marketing", "criadores"],
        adaptationExamples: [
          ex("marketing", "Reels de 20s explicando 1 métrica por vez."),
        ],
      },
      {
        title: "Carrossel de comparação lado a lado",
        context:
          "Formato 'opção A vs opção B' com prós e contras está gerando bons comentários em nichos de decisão.",
        whyItMatters:
          "Comparações ajudam o público a se posicionar nos comentários, o que aumenta engajamento.",
        adaptationTips:
          "Divida cada slide ao meio: esquerda opção A, direita opção B, com 1 critério por slide.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 68,
        contentFormat: ["carrossel"],
        recommendedNiches: ["negocios", "financas"],
        adaptationExamples: [
          ex(
            "financas",
            "Carrossel: 'poupança vs investimento simples' lado a lado.",
          ),
        ],
      },
    ],
    headlines: [
      {
        headline: "A comparação que vai mudar como você decide isso",
        category: "comparação",
        triggerType: "curiosidade",
        whyItWorks:
          "Promete clareza sobre uma decisão comum, o que gera salvamento para consulta futura.",
        adaptations: ["A comparação que faltava sobre isso"],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios"],
      },
      {
        headline: "20 segundos que explicam o que ninguém te explicou direito",
        category: "educativo direto",
        triggerType: "curiosidade",
        whyItWorks:
          "Promessa de brevidade + lacuna de conhecimento aumenta a taxa de clique.",
        adaptations: ["30 segundos que explicam o que todo mundo complica"],
        saturationLevel: "baixo",
        recommendedNiches: ["marketing", "criadores"],
      },
    ],
    contentSuggestions: [
      {
        title: "Carrossel comparativo A vs B",
        centralIdea:
          "Comparar duas abordagens comuns do nicho, uma por slide, com veredito no final.",
        recommendedFormat: "carrossel",
        suggestedHeadline: "A comparação que vai mudar como você decide isso",
        postStructure:
          "Slide 1: pergunta ('A ou B?'). Slides 2–4: prós/contras. Slide 5: veredito + CTA.",
        captionBase:
          "Legenda perguntando qual das duas opções o seguidor usa hoje.",
        cta: "Comenta A ou B — e por quê.",
        recommendedNiches: ["negocios", "financas"],
        difficultyLevel: "facil",
        opportunityScore: 66,
        personalizationPrompt:
          "Troque as opções A/B pelas duas abordagens mais comuns em {seu_nicho}.",
      },
    ],
  },
  {
    platformSlug: "instagram",
    editionDate: isoDate(-2),
    title: "Briefing Instagram — em revisão",
    slug: `briefing-instagram-${isoDate(-2)}`,
    summary: "Um editor está revisando esta edição agora.",
    status: "draft",
    reviewStatus: "in_review",
    briefing: {
      summary: "Edição menor, em análise, cobrindo um único sinal do dia.",
      whats_growing: ["Story com enquete técnica"],
      whats_saturated: [],
      opportunities: ["Story com enquete sobre o próprio conteúdo do feed"],
      recommended_formats: ["story"],
      practical_recommendations: ["Use enquete de 2 opções, não 4"],
    },
    trendItems: [
      {
        title: "Stories com enquete técnica geram mais respostas em DM",
        context:
          "Enquetes com opções técnicas (não genéricas tipo 'sim/não') puxam conversa em DM depois do voto.",
        whyItMatters:
          "DMs geradas por story são um sinal forte de interesse qualificado, útil pra qualificar audiência.",
        adaptationTips:
          "Faça a enquete sobre uma dúvida real do nicho, com 2 opções técnicas específicas.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 64,
        contentFormat: ["story"],
        recommendedNiches: ["marketing"],
        adaptationExamples: [
          ex("marketing", "Enquete: 'CTA no início ou no fim do carrossel?'"),
        ],
      },
    ],
    headlines: [
      {
        headline: "Qual dessas duas opções você usaria primeiro?",
        category: "enquete",
        triggerType: "curiosidade",
        whyItWorks:
          "Convida participação direta, o que aumenta interação sem exigir muito esforço do público.",
        adaptations: ["Você faria A ou B primeiro?"],
        saturationLevel: "baixo",
        recommendedNiches: ["marketing"],
      },
    ],
  },
  /* -------------------------------- LINKEDIN -------------------------------- */
  {
    platformSlug: "linkedin",
    editionDate: isoDate(0),
    title: "Briefing LinkedIn — contra-intuição vende mais que motivacional",
    slug: `briefing-linkedin-${isoDate(0)}`,
    summary:
      "O que está performando no feed profissional hoje, com exemplos prontos para adaptar.",
    status: "published",
    reviewStatus: "approved",
    publishedAt: daysFromNow(0),
    reviewedAt: daysFromNow(0),
    contentExpiresAt: daysFromNow(60),
    briefing: {
      summary:
        "Posts de opinião contra-intuitiva com dado de mercado seguem batendo posts motivacionais genéricos. Carrossel de bastidor de decisão de negócio está emergente.",
      whats_growing: [
        "Posts de opinião contra-intuitiva com fonte de mercado",
        "Carrossel de bastidor de decisão (por que escolhemos X e não Y)",
      ],
      whats_saturated: ["Post motivacional genérico sem caso real"],
      opportunities: [
        "Post de 'o que eu erraria se começasse hoje' com aprendizado real",
      ],
      recommended_formats: ["post_linkedin", "carrossel"],
      practical_recommendations: [
        "Cite a fonte do dado de mercado no próprio post, não só nos comentários",
        "Publique entre 8h e 10h para pegar o pico de leitura profissional",
      ],
    },
    trendItems: [
      {
        title: "Opinião contra-intuitiva com dado de mercado performa melhor",
        context:
          "Posts que desafiam um consenso comum do setor, citando uma fonte de mercado, geram mais comentários de discordância qualificada.",
        whyItMatters:
          "Comentários de discordância aumentam tempo de permanência no post e alcance orgânico no LinkedIn.",
        adaptationTips:
          "Abra com a opinião contra-intuitiva na primeira linha, cite a fonte no 2º parágrafo, feche convidando discordância.",
        riskLevel: "medio",
        saturationLevel: "emergente",
        opportunityScore: 79,
        contentFormat: ["post_linkedin"],
        recommendedNiches: ["negocios", "marketing"],
        adaptationExamples: [
          ex(
            "negocios",
            "'Contratar mais gente nem sempre resolve o problema de entrega' + dado de produtividade.",
          ),
        ],
      },
      {
        title: "Carrossel de bastidor de decisão de negócio",
        context:
          "Carrosséis explicando por que uma empresa escolheu uma abordagem e descartou outra estão sendo salvos por gestores.",
        whyItMatters:
          "Conteúdo de decisão real posiciona quem publica como referência prática, não teórica.",
        adaptationTips:
          "Slide 1: a decisão. Slides 2–3: os dois caminhos considerados. Slide 4: por que um venceu.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 71,
        contentFormat: ["carrossel"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [
          ex(
            "negocios",
            "Carrossel: 'por que escolhemos crescer devagar em vez de captar investimento'.",
          ),
        ],
      },
      {
        title: "Post motivacional genérico sem caso real está saturado",
        context:
          "Posts com frases de efeito sem exemplo concreto anexado estão recebendo cada vez menos comentários substantivos.",
        whyItMatters:
          "Sinaliza risco: reaproveitar esse formato sem um caso real reduz credibilidade e alcance.",
        adaptationTips:
          "Sempre ancore a frase motivacional em um exemplo numérico ou situação real, não deixe solta.",
        riskLevel: "alto",
        saturationLevel: "saturado",
        opportunityScore: 22,
        contentFormat: ["post_linkedin"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [
          ex(
            "negocios",
            "Troque 'persistência é tudo' por 'levamos 14 meses até o primeiro cliente pagante — e quase desistimos no mês 9'.",
          ),
        ],
      },
    ],
    headlines: [
      {
        headline:
          "Contratar mais gente nem sempre resolve o problema de entrega",
        category: "contra-intuição com dado",
        triggerType: "curiosidade",
        whyItWorks:
          "Desafia um instinto comum de gestão, gerando comentários de concordância e discordância.",
        adaptations: [
          "Aumentar orçamento nem sempre resolve o problema de aquisição",
          "Trabalhar mais horas nem sempre resolve o problema de produtividade",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["negocios"],
      },
      {
        headline:
          "Por que escolhemos crescer devagar em vez de captar investimento",
        category: "bastidor de decisão",
        triggerType: "prova_social",
        whyItWorks:
          "Decisão real e específica soa mais autêntica que conselho genérico, gerando confiança.",
        adaptations: [
          "Por que escolhemos não contratar agência de marketing",
          "Por que escolhemos manter o time pequeno em 2026",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios"],
      },
      {
        headline: "O que eu erraria se começasse do zero hoje",
        category: "aprendizado retrospectivo",
        triggerType: "medo_de_errar",
        whyItWorks:
          "Aproveita a autoridade de quem já passou pelo caminho para antecipar erros do leitor.",
        adaptations: [
          "3 decisões que eu revisitaria se começasse hoje",
          "O conselho que eu ignorei e me custou 6 meses",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios", "marketing"],
      },
      {
        headline: "O dado de mercado que ninguém está comentando",
        category: "prova com números",
        triggerType: "novidade",
        whyItWorks:
          "Combina exclusividade percebida com dado concreto, aumentando o desejo de estar informado.",
        adaptations: [
          "O relatório de mercado que passou despercebido essa semana",
          "O número que devia estar em toda reunião de planejamento",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["negocios", "marketing"],
      },
      {
        headline: "Levamos 14 meses até o primeiro cliente pagante",
        category: "estudo de caso pessoal",
        triggerType: "ganho",
        whyItWorks:
          "Transparência sobre tempo real de resultado gera identificação e reduz ansiedade de comparação.",
        adaptations: [
          "Levamos 8 meses até o produto fazer sentido",
          "Demorou 1 ano até o funil realmente converter",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios"],
      },
    ],
    copyPatterns: [
      {
        title: "Contra-intuição ancorada em dado",
        observedHeadline:
          "Contratar mais gente nem sempre resolve o problema de entrega",
        category: "quebra_de_crenca",
        hookType: "afirmação contra-intuitiva",
        triggerType: "curiosidade",
        explanation:
          "Desafia um instinto de gestão amplamente aceito, criando abertura para debate qualificado nos comentários.",
        structure: "[Ação óbvia] nem sempre resolve [problema comum]",
        adaptationExamples: [
          ex(
            "negocios",
            "Baixar preço nem sempre resolve o problema de conversão",
          ),
        ],
        tags: ["copy", "gancho"],
      },
      {
        title: "Bastidor de decisão com dois caminhos",
        observedHeadline: "Por que escolhemos crescer devagar",
        category: "prova_social",
        hookType: "narrativa de decisão",
        triggerType: "prova_social",
        explanation:
          "Mostrar os dois caminhos considerados (e não só o escolhido) aumenta credibilidade da decisão final.",
        structure: "Por que escolhemos [caminho A] em vez de [caminho B]",
        adaptationExamples: [
          ex(
            "negocios",
            "Por que escolhemos atender menos clientes com mais qualidade",
          ),
        ],
        tags: ["copy", "storytelling"],
      },
    ],
    visualPatterns: [
      {
        title: "Carrossel corporativo de decisão",
        visualStyle: "editorial corporativo",
        colors: ["fundo off-white", "texto grafite", "destaque em azul marca"],
        typographyNotes:
          "Título curto no topo de cada slide, corpo de texto em fonte sans legível a partir de miniatura.",
        compositionNotes:
          "Máximo 3 linhas de texto por slide; ícone simples ilustrando cada caminho considerado.",
        whyItWorks:
          "Transmite seriedade sem parecer um relatório denso, mantendo leitura rápida no feed.",
        howToAdapt:
          "Use um template com 2 colunas (caminho A / caminho B) e reaproveite para qualquer decisão futura.",
        tags: ["visual", "corporativo"],
      },
    ],
    contentSuggestions: [
      {
        title: "Post de opinião contra-intuitiva com fonte",
        centralIdea:
          "Desafiar um consenso do setor citando um dado de mercado concreto.",
        recommendedFormat: "post_linkedin",
        suggestedHeadline:
          "Contratar mais gente nem sempre resolve o problema de entrega",
        postStructure:
          "Linha 1: a afirmação contra-intuitiva. Parágrafo 2: a fonte do dado. Parágrafo 3: convite à discordância.",
        captionBase: "N/A — post nativo de texto, sem legenda separada.",
        cta: "Discorda? Conta sua experiência nos comentários.",
        recommendedNiches: ["negocios", "marketing"],
        difficultyLevel: "medio",
        opportunityScore: 74,
        personalizationPrompt:
          "Troque a afirmação por um consenso específico do seu setor {seu_nicho}, com uma fonte real.",
      },
      {
        title: "Carrossel de bastidor de decisão",
        centralIdea:
          "Explicar por que uma decisão de negócio foi tomada, mostrando a alternativa descartada.",
        recommendedFormat: "carrossel",
        suggestedHeadline:
          "Por que escolhemos crescer devagar em vez de captar investimento",
        postStructure:
          "Slide 1: a decisão. Slides 2–3: os dois caminhos. Slide 4: por que um venceu + CTA.",
        captionBase:
          "Legenda resumindo em 1 frase o aprendizado principal da decisão.",
        cta: "Comenta se você já teve que escolher entre esses dois caminhos.",
        recommendedNiches: ["negocios"],
        difficultyLevel: "medio",
        opportunityScore: 69,
        personalizationPrompt:
          "Substitua pela decisão mais relevante que você tomou recentemente em {seu_nicho}.",
      },
      {
        title: "Post retrospectivo de erros",
        centralIdea:
          "Compartilhar o que você faria diferente se começasse hoje, com aprendizado prático.",
        recommendedFormat: "post_linkedin",
        suggestedHeadline: "O que eu erraria se começasse do zero hoje",
        postStructure:
          "Lista de 3 itens curtos, cada um com o erro e o aprendizado em 1 frase.",
        captionBase: "N/A — post nativo de texto.",
        cta: "Qual desses você também já viveu? Comenta.",
        recommendedNiches: ["negocios"],
        difficultyLevel: "facil",
        opportunityScore: 65,
        personalizationPrompt:
          "Substitua os 3 erros pelos mais relevantes da sua trajetória em {seu_nicho}.",
      },
    ],
    exploreReports: [
      {
        title: "Padrões observados em fontes legais (LinkedIn)",
        summary:
          "Análise de ganchos e formatos recorrentes a partir de fontes autorizadas de marketing e tendências digitais.",
        observedPatterns: [
          "Opinião contra-intuitiva ancorada em dado de mercado",
          "Bastidor de decisão com dois caminhos comparados",
          "Post motivacional genérico perdendo engajamento",
        ],
        recommendation:
          "Priorize opinião contra-intuitiva com fonte citada nesta semana; evite motivacional sem caso real anexado.",
      },
    ],
    comments: [
      {
        authorName: "João Almeida",
        body: "Esse padrão de contra-intuição com dado é exatamente o que tenho visto performar melhor no feed B2B.",
      },
      {
        authorName: "Camila Rocha",
        body: "O exemplo do bastidor de decisão ficou muito bom, vou adaptar pra minha empresa essa semana.",
      },
    ],
  },
  {
    platformSlug: "linkedin",
    editionDate: isoDate(-1),
    title: "Briefing LinkedIn — rascunho aguardando revisão",
    slug: `briefing-linkedin-${isoDate(-1)}`,
    summary: "Gerado automaticamente, ainda não revisado por um editor.",
    status: "draft",
    reviewStatus: "pending",
    briefing: {
      summary: "Sinais do dia apontam para posts de aprendizado com número.",
      whats_growing: ["Post de '3 aprendizados' com número no título"],
      whats_saturated: [],
      opportunities: ["Post citando um erro específico do trimestre"],
      recommended_formats: ["post_linkedin"],
      practical_recommendations: ["Use número ímpar no título (3, 5, 7)"],
    },
    trendItems: [
      {
        title:
          "Posts de '3 aprendizados' com número no título performam melhor",
        context:
          "Títulos com número ímpar específico geram mais cliques que 'alguns aprendizados' genérico.",
        whyItMatters:
          "Número no título sinaliza organização e economia de tempo de leitura, o que aumenta abertura.",
        adaptationTips:
          "Use sempre número ímpar (3, 5, 7) — parecem mais naturais que pares.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 62,
        contentFormat: ["post_linkedin"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [
          ex("negocios", "'5 aprendizados de um trimestre difícil'."),
        ],
      },
      {
        title: "Post citando erro específico do trimestre",
        context:
          "Posts admitindo um erro concreto e recente (não genérico) geram mais comentários de apoio.",
        whyItMatters:
          "Vulnerabilidade específica gera mais confiança que vulnerabilidade genérica.",
        adaptationTips:
          "Cite o trimestre exato e o impacto numérico do erro, se possível.",
        riskLevel: "medio",
        saturationLevel: "emergente",
        opportunityScore: 58,
        contentFormat: ["post_linkedin"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [
          ex("negocios", "'No Q2 perdemos 20% do funil por causa disso'."),
        ],
      },
    ],
    headlines: [
      {
        headline: "5 aprendizados de um trimestre difícil",
        category: "lista numerada",
        triggerType: "prova_social",
        whyItWorks:
          "Número ímpar específico sinaliza organização e economiza tempo de leitura percebido.",
        adaptations: ["3 aprendizados que eu não esperava"],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios"],
      },
      {
        headline: "No Q2 perdemos 20% do funil por causa disso",
        category: "confissão específica",
        triggerType: "medo_de_errar",
        whyItWorks:
          "Número específico e recente aumenta credibilidade e curiosidade sobre a causa.",
        adaptations: [
          "No mês passado quase perdemos nosso maior cliente por isso",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["negocios"],
      },
    ],
    contentSuggestions: [
      {
        title: "Post de aprendizados numerados",
        centralIdea:
          "Listar aprendizados reais e recentes com número ímpar no título.",
        recommendedFormat: "post_linkedin",
        suggestedHeadline: "5 aprendizados de um trimestre difícil",
        postStructure:
          "Título com número. Um parágrafo curto por aprendizado, numerado.",
        captionBase: "N/A — post nativo de texto.",
        cta: "Qual desses ressoa mais com você agora?",
        recommendedNiches: ["negocios"],
        difficultyLevel: "facil",
        opportunityScore: 60,
        personalizationPrompt:
          "Troque pelos aprendizados reais do seu último trimestre em {seu_nicho}.",
      },
    ],
  },
  {
    platformSlug: "linkedin",
    editionDate: isoDate(-2),
    title: "Briefing LinkedIn — rejeitado na revisão",
    slug: `briefing-linkedin-${isoDate(-2)}`,
    summary: "Revisado e rejeitado — conteúdo genérico demais para publicar.",
    status: "draft",
    reviewStatus: "rejected",
    reviewedAt: daysFromNow(-1),
    reviewedBy: randomUUID(),
    briefing: {
      summary: "Sinal único e fraco, sem exemplo concreto o suficiente.",
      whats_growing: [],
      whats_saturated: ["Frase de efeito sem caso real"],
      opportunities: [],
      recommended_formats: ["post_linkedin"],
      practical_recommendations: [],
    },
    trendItems: [
      {
        title: "Frase de efeito sem caso real anexado",
        context:
          "Sinal fraco: poucos posts, sem exemplo forte de aplicação prática identificado nas fontes do dia.",
        whyItMatters:
          "Não há evidência suficiente de que isso gera engajamento — por isso foi rejeitado na revisão.",
        adaptationTips: "Não recomendado sem um caso real para ancorar.",
        riskLevel: "alto",
        saturationLevel: "saturado",
        opportunityScore: 18,
        contentFormat: ["post_linkedin"],
        recommendedNiches: ["negocios"],
        adaptationExamples: [],
      },
    ],
    headlines: [
      {
        headline: "O sucesso é uma jornada, não um destino",
        category: "frase de efeito",
        triggerType: "curiosidade",
        whyItWorks:
          "Na prática, não funciona bem sem ancoragem em um caso real — mantido aqui como exemplo do que evitar.",
        adaptations: [],
        saturationLevel: "saturado",
        recommendedNiches: ["negocios"],
      },
    ],
  },
  /* --------------------------------- THREADS --------------------------------- */
  {
    platformSlug: "threads",
    editionDate: isoDate(0),
    title: "Briefing Threads — hot takes com contexto",
    slug: `briefing-threads-${isoDate(0)}`,
    summary:
      "O que está gerando resposta no Threads hoje, sem depender só de polêmica vazia.",
    status: "published",
    reviewStatus: "approved",
    publishedAt: daysFromNow(0),
    reviewedAt: daysFromNow(0),
    contentExpiresAt: daysFromNow(60),
    briefing: {
      summary:
        "Hot takes curtos com 1 frase de contexto na sequência geram mais respostas que hot takes soltos. Threads de bastidor de erro seguem crescendo.",
      whats_growing: [
        "Hot take + 1 réplica de contexto do próprio autor",
        "Thread curta de 'erro que cometi essa semana'",
      ],
      whats_saturated: ["Hot take solto sem nenhum contexto"],
      opportunities: ["Thread de pergunta aberta seguida de opinião própria"],
      recommended_formats: ["thread", "post_unico"],
      practical_recommendations: [
        "Sempre responda seu próprio post com 1 frase de contexto",
        "Publique no fim da tarde, quando o Threads tem mais atividade de resposta",
      ],
    },
    trendItems: [
      {
        title: "Hot take + réplica de contexto gera mais resposta",
        context:
          "Posts curtos e provocativos seguidos de uma réplica própria explicando o raciocínio recebem mais respostas que hot takes isolados.",
        whyItMatters:
          "A réplica de contexto reduz interpretação errada e convida o público a comentar com mais profundidade.",
        adaptationTips:
          "Publique o hot take em 1 frase, espere 1–2 minutos e responda com o contexto em outra frase curta.",
        riskLevel: "medio",
        saturationLevel: "emergente",
        opportunityScore: 76,
        contentFormat: ["thread"],
        recommendedNiches: ["marketing", "criadores"],
        adaptationExamples: [
          ex(
            "marketing",
            "'CTA no meio do post converte mais que no fim.' + réplica: 'porque quem chega no fim já decidiu.'",
          ),
        ],
      },
      {
        title: "Thread curta de 'erro que cometi essa semana'",
        context:
          "Threads curtas (2–3 posts) admitindo um erro recente e específico geram engajamento consistente.",
        whyItMatters:
          "Vulnerabilidade específica e recente humaniza a marca pessoal sem parecer fraqueza genérica.",
        adaptationTips:
          "Poste 1: o erro. Poste 2: o que você faria diferente. Sem post 3 de moral da história forçada.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 69,
        contentFormat: ["thread"],
        recommendedNiches: ["criadores", "negocios"],
        adaptationExamples: [
          ex(
            "criadores",
            "'Publiquei no horário errado essa semana e o alcance despencou.'",
          ),
        ],
      },
      {
        title: "Hot take solto sem contexto está saturado",
        context:
          "Hot takes isolados, sem nenhuma réplica de contexto, estão gerando mais brigas que discussão qualificada.",
        whyItMatters:
          "Alerta de risco reputacional: sem contexto, o hot take vira munição para leitura mal-intencionada.",
        adaptationTips:
          "Nunca publique um hot take polêmico sem já ter a réplica de contexto pronta.",
        riskLevel: "alto",
        saturationLevel: "saturado",
        opportunityScore: 30,
        contentFormat: ["post_unico"],
        recommendedNiches: ["marketing"],
        adaptationExamples: [],
      },
    ],
    headlines: [
      {
        headline: "CTA no meio do post converte mais que no fim",
        category: "hot take com contexto",
        triggerType: "curiosidade",
        whyItWorks:
          "Contraria um hábito comum (CTA sempre no fim), gerando curiosidade sobre o motivo.",
        adaptations: [
          "Legenda curta converte mais que legenda longa",
          "Postar de manhã converte menos do que você pensa",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["marketing"],
      },
      {
        headline:
          "Publiquei no horário errado essa semana e o alcance despencou",
        category: "confissão específica",
        triggerType: "medo_de_errar",
        whyItWorks:
          "Erro concreto e recente gera identificação imediata com quem também erra o timing.",
        adaptations: [
          "Usei a legenda errada essa semana e perdi metade do alcance",
          "Ignorei os comentários por 2 dias e o algoritmo me puniu",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["criadores"],
      },
      {
        headline: "Ninguém fala sobre isso, mas devia",
        category: "novidade / lacuna",
        triggerType: "novidade",
        whyItWorks:
          "Sinaliza exclusividade de informação, o que aumenta a vontade de conferir o conteúdo completo.",
        adaptations: [
          "Isso devia ser óbvio, mas não é",
          "Todo mundo ignora isso e não devia",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["marketing", "criadores"],
      },
    ],
    contentSuggestions: [
      {
        title: "Hot take com réplica de contexto",
        centralIdea:
          "Publicar uma opinião curta e provocativa, seguida de uma réplica explicando o raciocínio.",
        recommendedFormat: "thread",
        suggestedHeadline: "CTA no meio do post converte mais que no fim",
        postStructure:
          "Post 1: a opinião em 1 frase. Post 2 (réplica): o porquê em 1–2 frases.",
        captionBase: "N/A — thread nativa, sem legenda separada.",
        cta: "Concorda? Responde com sua experiência.",
        recommendedNiches: ["marketing", "criadores"],
        difficultyLevel: "facil",
        opportunityScore: 72,
        personalizationPrompt:
          "Troque a opinião por um hábito comum do seu nicho {seu_nicho} que você discorda.",
      },
      {
        title: "Thread de erro recente",
        centralIdea:
          "Admitir um erro específico e recente, sem moral da história forçada.",
        recommendedFormat: "thread",
        suggestedHeadline:
          "Publiquei no horário errado essa semana e o alcance despencou",
        postStructure: "Post 1: o erro. Post 2: o que faria diferente.",
        captionBase: "N/A — thread nativa.",
        cta: "Já passou por isso? Responde aqui.",
        recommendedNiches: ["criadores"],
        difficultyLevel: "facil",
        opportunityScore: 64,
        personalizationPrompt:
          "Substitua pelo erro mais recente e específico que você cometeu em {seu_nicho}.",
      },
    ],
    comments: [
      {
        authorName: "Diego Martins",
        body: "Comecei a responder meus próprios hot takes com contexto e realmente as respostas ficaram mais construtivas.",
      },
    ],
  },
  {
    platformSlug: "threads",
    editionDate: isoDate(-1),
    title: "Briefing Threads — rascunho aguardando revisão",
    slug: `briefing-threads-${isoDate(-1)}`,
    summary: "Gerado automaticamente, ainda não revisado por um editor.",
    status: "draft",
    reviewStatus: "pending",
    briefing: {
      summary: "Sinal do dia: perguntas abertas puxando resposta com opinião.",
      whats_growing: ["Pergunta aberta seguida de opinião própria"],
      whats_saturated: [],
      opportunities: ["Pergunta binária simples sobre hábito do nicho"],
      recommended_formats: ["thread"],
      practical_recommendations: [
        "Responda a própria pergunta antes de qualquer outro comentar",
      ],
    },
    trendItems: [
      {
        title: "Pergunta aberta + opinião própria na réplica",
        context:
          "Fazer uma pergunta genuína e responder com sua própria opinião na sequência incentiva mais gente a discordar ou concordar.",
        whyItMatters:
          "Gera volume de resposta maior que pergunta solta, porque dá um ponto de partida pra discordar.",
        adaptationTips:
          "Não espere respostas alheias — responda sua própria pergunta primeiro.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 61,
        contentFormat: ["thread"],
        recommendedNiches: ["criadores"],
        adaptationExamples: [
          ex(
            "criadores",
            "'Vocês editam antes ou depois de escrever a legenda? Eu edito depois.'",
          ),
        ],
      },
    ],
    headlines: [
      {
        headline: "Vocês fazem isso antes ou depois? Eu faço depois",
        category: "pergunta com opinião",
        triggerType: "curiosidade",
        whyItWorks:
          "Combina pergunta genuína com posicionamento próprio, facilitando a resposta do público.",
        adaptations: ["Vocês preferem A ou B? Eu prefiro A"],
        saturationLevel: "emergente",
        recommendedNiches: ["criadores"],
      },
    ],
  },
  {
    platformSlug: "threads",
    editionDate: isoDate(3),
    title: "Briefing Threads — agendado",
    slug: `briefing-threads-${isoDate(3)}`,
    summary: "Aprovado e agendado para publicação futura.",
    status: "scheduled",
    reviewStatus: "approved",
    reviewedAt: daysFromNow(0),
    briefing: {
      summary: "Edição pequena, aprovada e programada para os próximos dias.",
      whats_growing: ["Thread de previsão curta para a semana"],
      whats_saturated: [],
      opportunities: ["Thread prevendo um tema que deve bombar na semana"],
      recommended_formats: ["thread"],
      practical_recommendations: ["Publique cedo na segunda-feira"],
    },
    trendItems: [
      {
        title: "Thread de previsão curta para a semana",
        context:
          "Threads antecipando um tema que deve ganhar tração na semana têm sido citadas depois como 'eu avisei'.",
        whyItMatters:
          "Acertar a previsão constrói autoridade e gera prints/compartilhamentos depois.",
        adaptationTips:
          "Seja específico na previsão — vago demais não gera crédito depois.",
        riskLevel: "medio",
        saturationLevel: "emergente",
        opportunityScore: 55,
        contentFormat: ["thread"],
        recommendedNiches: ["marketing"],
        adaptationExamples: [
          ex(
            "marketing",
            "'Aposto que carrossel de dados vai dominar essa semana.'",
          ),
        ],
      },
    ],
    headlines: [
      {
        headline: "Minha aposta para o que vai bombar essa semana",
        category: "previsão",
        triggerType: "novidade",
        whyItWorks:
          "Cria expectativa e um gancho natural para revisitar o post depois, validando (ou não) a previsão.",
        adaptations: ["O que eu acho que vai dominar o feed essa semana"],
        saturationLevel: "emergente",
        recommendedNiches: ["marketing"],
      },
    ],
  },
  /* --------------------------------- TIKTOK --------------------------------- */
  {
    platformSlug: "tiktok",
    editionDate: isoDate(0),
    title: "Briefing TikTok — ganchos nos primeiros 2 segundos",
    slug: `briefing-tiktok-${isoDate(0)}`,
    summary:
      "O que está prendendo atenção nos primeiros segundos do TikTok hoje.",
    status: "published",
    reviewStatus: "approved",
    publishedAt: daysFromNow(0),
    reviewedAt: daysFromNow(0),
    contentExpiresAt: daysFromNow(60),
    briefing: {
      summary:
        "Vídeos que mostram o resultado antes de explicar o processo estão retendo mais nos primeiros 2 segundos. Voz em off genérica sem rosto está saturada.",
      whats_growing: [
        "Mostrar o resultado no frame 1, explicar o processo depois",
        "Texto na tela sincronizado com a fala, frase por frase",
      ],
      whats_saturated: ["Voz em off genérica sem rosto nem contexto visual"],
      opportunities: [
        "Vídeo de 'resultado primeiro' aplicado a tutorial técnico",
      ],
      recommended_formats: ["reels", "post_unico"],
      practical_recommendations: [
        "Coloque o resultado final nos primeiros 2 segundos, sempre",
        "Sincronize o texto na tela com a fala, sem atraso",
      ],
    },
    trendItems: [
      {
        title: "Mostrar o resultado no frame 1 aumenta retenção",
        context:
          "Vídeos que abrem com o resultado final (antes de explicar como chegou lá) retêm mais visualizações nos primeiros 2 segundos.",
        whyItMatters:
          "Retenção nos primeiros segundos é o principal sinal para o algoritmo continuar distribuindo o vídeo.",
        adaptationTips:
          "Grave o resultado primeiro, corte pra o início do vídeo, e só depois explique o processo.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 85,
        contentFormat: ["reels"],
        recommendedNiches: ["criadores", "marketing"],
        adaptationExamples: [
          ex(
            "criadores",
            "Mostra o carrossel pronto no frame 1, depois explica como fez.",
          ),
        ],
      },
      {
        title: "Texto na tela sincronizado frase por frase",
        context:
          "Legendas na tela que aparecem exatamente no ritmo da fala (não em blocos grandes) mantêm mais gente assistindo sem áudio.",
        whyItMatters:
          "Grande parte da audiência assiste sem som — texto bem sincronizado é o que garante a mensagem passar.",
        adaptationTips:
          "Edite frase por frase, nunca em blocos de parágrafo inteiro.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 73,
        contentFormat: ["reels"],
        recommendedNiches: ["criadores"],
        adaptationExamples: [
          ex(
            "criadores",
            "Cada frase do gancho aparece e some sozinha, no ritmo da fala.",
          ),
        ],
      },
      {
        title: "Voz em off genérica sem rosto está saturada",
        context:
          "Vídeos com voz em off genérica, sem rosto nem contexto visual próprio, estão perdendo retenção frente a formatos mais pessoais.",
        whyItMatters:
          "Alerta de risco: reaproveitar esse formato sem um elemento pessoal reduz o alcance orgânico.",
        adaptationTips:
          "Adicione ao menos um corte com o rosto de quem está falando, mesmo que breve.",
        riskLevel: "medio",
        saturationLevel: "saturado",
        opportunityScore: 28,
        contentFormat: ["post_unico"],
        recommendedNiches: ["marketing"],
        adaptationExamples: [],
      },
    ],
    headlines: [
      {
        headline: "O resultado que eu não esperava aparece em 2 segundos",
        category: "gancho de resultado imediato",
        triggerType: "curiosidade",
        whyItWorks:
          "Entrega uma prévia do payoff imediatamente, reduzindo a chance de abandono nos primeiros segundos.",
        adaptations: [
          "Isso aconteceu logo nos primeiros segundos",
          "O antes e depois que ninguém esperava",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["criadores"],
      },
      {
        headline: "Fiz isso sem edição nenhuma e o resultado surpreendeu",
        category: "prova de processo real",
        triggerType: "prova_social",
        whyItWorks:
          "Combina autenticidade percebida com promessa de resultado, gerando curiosidade e confiança.",
        adaptations: [
          "Zero edição, resultado real",
          "Sem cortes escondidos — é isso mesmo que aconteceu",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["criadores"],
      },
      {
        headline: "Ninguém está mostrando esse processo do jeito certo",
        category: "lacuna de mercado",
        triggerType: "novidade",
        whyItWorks:
          "Sinaliza informação exclusiva não disponível em outro lugar, aumentando a atenção nos primeiros segundos.",
        adaptations: [
          "O processo que ninguém explica direito",
          "Isso devia ser o padrão e não é",
        ],
        saturationLevel: "emergente",
        recommendedNiches: ["criadores", "marketing"],
      },
      {
        headline: "3 segundos que definem se seu vídeo viraliza ou não",
        category: "alerta educativo",
        triggerType: "medo_de_errar",
        whyItWorks:
          "Cria urgência sobre um detalhe técnico específico e mensurável (3 segundos), reduzindo procrastinação.",
        adaptations: [
          "O primeiro segundo que decide tudo",
          "2 segundos que separam viral de esquecido",
        ],
        saturationLevel: "baixo",
        recommendedNiches: ["marketing", "criadores"],
      },
      {
        headline:
          "Troquei a voz em off por aparecer de rosto e o alcance dobrou",
        category: "resultado / ganho",
        triggerType: "ganho",
        whyItWorks:
          "Resultado numérico específico (dobrou) associado a uma mudança concreta e replicável.",
        adaptations: [
          "Parei de usar voz em off e o alcance mudou",
          "Uma mudança simples que dobrou meu alcance",
        ],
        saturationLevel: "medio",
        recommendedNiches: ["criadores"],
      },
    ],
    copyPatterns: [
      {
        title: "Resultado primeiro, processo depois",
        observedHeadline:
          "O resultado que eu não esperava aparece em 2 segundos",
        category: "gancho_de_resultado",
        hookType: "prévia de payoff",
        triggerType: "curiosidade",
        explanation:
          "Entregar uma prévia do resultado nos primeiros segundos reduz abandono e aumenta retenção.",
        structure: "[Resultado] aparece em [tempo curto]",
        adaptationExamples: [
          ex("criadores", "O carrossel pronto aparece em 2 segundos"),
        ],
        tags: ["copy", "gancho"],
      },
    ],
    visualPatterns: [
      {
        title: "Texto sincronizado frase a frase",
        visualStyle: "dinâmico com legenda animada",
        colors: ["fundo do vídeo original", "texto branco com contorno escuro"],
        typographyNotes:
          "Fonte bold, alto contraste, uma frase curta por vez, nunca um parágrafo inteiro.",
        compositionNotes:
          "Texto sempre no terço central ou inferior, longe da UI do app.",
        whyItWorks:
          "Garante que a mensagem passe mesmo sem áudio, mantendo o vídeo assistível em qualquer contexto.",
        howToAdapt:
          "Use um template de legenda animada e ajuste só o timing por frase a cada vídeo.",
        tags: ["visual", "legenda"],
      },
    ],
    contentSuggestions: [
      {
        title: "Vídeo de resultado primeiro",
        centralIdea:
          "Mostrar o resultado final logo no frame 1, explicando o processo na sequência.",
        recommendedFormat: "reels",
        suggestedHeadline:
          "O resultado que eu não esperava aparece em 2 segundos",
        postStructure:
          "0–2s: resultado final. 2–15s: processo resumido. 15–20s: CTA.",
        captionBase: "Legenda curta reforçando o resultado mostrado no início.",
        cta: "Segue pra ver o processo completo no próximo vídeo.",
        recommendedNiches: ["criadores", "marketing"],
        difficultyLevel: "medio",
        opportunityScore: 80,
        personalizationPrompt:
          "Troque o resultado mostrado pelo mais impressionante do seu processo em {seu_nicho}.",
      },
      {
        title: "Vídeo de mudança simples com resultado numérico",
        centralIdea:
          "Mostrar uma mudança pequena e concreta que gerou um resultado mensurável.",
        recommendedFormat: "reels",
        suggestedHeadline:
          "Troquei a voz em off por aparecer de rosto e o alcance dobrou",
        postStructure:
          "0–3s: a mudança em uma frase. 3–15s: como aplicar. 15–20s: o resultado numérico.",
        captionBase: "Legenda citando o número do resultado.",
        cta: "Testa essa mudança essa semana e me conta o resultado.",
        recommendedNiches: ["criadores"],
        difficultyLevel: "facil",
        opportunityScore: 68,
        personalizationPrompt:
          "Troque pela mudança simples mais impactante que você já testou em {seu_nicho}.",
      },
    ],
    exploreReports: [
      {
        title: "Padrões observados em fontes legais (TikTok)",
        summary:
          "Análise de ganchos e formatos recorrentes a partir de fontes autorizadas de tendências digitais.",
        observedPatterns: [
          "Resultado mostrado no frame 1",
          "Texto sincronizado frase a frase",
          "Voz em off genérica perdendo retenção",
        ],
        recommendation:
          "Priorize vídeos de 'resultado primeiro' com legenda sincronizada; evite voz em off sem nenhum corte de rosto.",
      },
    ],
    comments: [
      {
        authorName: "Bianca Ferreira",
        body: "Comecei a cortar o resultado pro início do vídeo e a retenção nos primeiros segundos melhorou muito.",
      },
      {
        authorName: "Pedro Vasconcelos",
        body: "Confirmo o ponto da legenda sincronizada, faz muita diferença pra quem assiste sem som.",
      },
    ],
  },
  {
    platformSlug: "tiktok",
    editionDate: isoDate(-1),
    title: "Briefing TikTok — rascunho aguardando revisão",
    slug: `briefing-tiktok-${isoDate(-1)}`,
    summary: "Gerado automaticamente, ainda não revisado por um editor.",
    status: "draft",
    reviewStatus: "pending",
    briefing: {
      summary: "Sinal do dia: vídeos de comparação rápida entre dois métodos.",
      whats_growing: ["Vídeo de comparação rápida (menos de 15s)"],
      whats_saturated: [],
      opportunities: ["Comparação rápida entre ferramenta A e ferramenta B"],
      recommended_formats: ["reels"],
      practical_recommendations: [
        "Mantenha abaixo de 15s para forçar objetividade",
      ],
    },
    trendItems: [
      {
        title: "Vídeo de comparação rápida entre dois métodos",
        context:
          "Vídeos curtos comparando duas ferramentas ou métodos, sem enrolação, estão sendo bem assistidos até o fim.",
        whyItMatters:
          "Formato curto e objetivo casa bem com o comportamento de consumo rápido da plataforma.",
        adaptationTips:
          "Corte tudo que não for a comparação direta; sem introdução longa.",
        riskLevel: "baixo",
        saturationLevel: "emergente",
        opportunityScore: 63,
        contentFormat: ["reels"],
        recommendedNiches: ["marketing"],
        adaptationExamples: [
          ex("marketing", "'Ferramenta A vs Ferramenta B em 12 segundos.'"),
        ],
      },
      {
        title: "Comparação rápida entre ferramenta A e B",
        context:
          "Especificamente comparações de ferramentas de trabalho (não produtos de consumo) estão em alta entre criadores B2B.",
        whyItMatters:
          "Público profissional busca decisão rápida, e o formato entrega isso sem fricção.",
        adaptationTips:
          "Mostre a tela de cada ferramenta por 3-4 segundos, com 1 critério de comparação por vez.",
        riskLevel: "baixo",
        saturationLevel: "baixo",
        opportunityScore: 59,
        contentFormat: ["reels"],
        recommendedNiches: ["marketing", "negocios"],
        adaptationExamples: [],
      },
    ],
    headlines: [
      {
        headline: "Ferramenta A vs Ferramenta B em 12 segundos",
        category: "comparação rápida",
        triggerType: "curiosidade",
        whyItWorks:
          "Promessa de brevidade e objetividade aumenta a chance de assistir até o fim.",
        adaptations: ["Método A vs Método B em 10 segundos"],
        saturationLevel: "emergente",
        recommendedNiches: ["marketing"],
      },
      {
        headline: "A diferença entre essas duas ferramentas em poucos segundos",
        category: "comparação rápida",
        triggerType: "curiosidade",
        whyItWorks:
          "Reduz o esforço percebido para decidir entre duas opções conhecidas.",
        adaptations: ["Qual dessas duas vale mais a pena? Descubra rápido"],
        saturationLevel: "baixo",
        recommendedNiches: ["negocios"],
      },
    ],
    contentSuggestions: [
      {
        title: "Vídeo de comparação rápida",
        centralIdea:
          "Comparar duas ferramentas ou métodos do nicho em menos de 15 segundos.",
        recommendedFormat: "reels",
        suggestedHeadline: "Ferramenta A vs Ferramenta B em 12 segundos",
        postStructure:
          "0–3s: pergunta ('A ou B?'). 3–10s: comparação direta. 10–15s: veredito.",
        captionBase: "Legenda perguntando qual o seguidor usa hoje.",
        cta: "Comenta qual você usa.",
        recommendedNiches: ["marketing", "negocios"],
        difficultyLevel: "facil",
        opportunityScore: 61,
        personalizationPrompt:
          "Troque pelas duas ferramentas/métodos mais relevantes do seu nicho {seu_nicho}.",
      },
    ],
  },
  {
    platformSlug: "tiktok",
    editionDate: isoDate(-10),
    title: "Briefing TikTok — arquivado",
    slug: `briefing-tiktok-${isoDate(-10)}`,
    summary: "Publicado, expirado e arquivado — mantido só para histórico.",
    status: "archived",
    reviewStatus: "approved",
    publishedAt: daysFromNow(-10),
    reviewedAt: daysFromNow(-10),
    contentExpiresAt: daysFromNow(-5),
    isArchived: true,
    briefing: {
      summary: "Edição antiga, já fora da janela de retenção do plano.",
      whats_growing: ["Duetos de reação curta"],
      whats_saturated: [],
      opportunities: [],
      recommended_formats: ["reels"],
      practical_recommendations: [],
    },
    trendItems: [
      {
        title: "Duetos de reação curta (conteúdo histórico)",
        context:
          "Sinal já antigo, mantido apenas como exemplo de edição arquivada/expirada para testes de UI.",
        whyItMatters:
          "Serve para validar como a interface trata conteúdo expirado/arquivado, não como recomendação atual.",
        adaptationTips: "Não aplicável — conteúdo fora da janela de retenção.",
        riskLevel: "baixo",
        saturationLevel: "medio",
        opportunityScore: 40,
        contentFormat: ["reels"],
        recommendedNiches: ["criadores"],
        adaptationExamples: [],
      },
    ],
    headlines: [
      {
        headline: "Reagi a isso sem esperar esse final (edição arquivada)",
        category: "reação",
        triggerType: "curiosidade",
        whyItWorks:
          "Exemplo histórico mantido apenas para popular o estado 'arquivado' da interface.",
        adaptations: [],
        saturationLevel: "medio",
        recommendedNiches: ["criadores"],
      },
    ],
  },
];

async function seedEdition(
  def: DemoEdition,
): Promise<{ editionId: string; platformId: string } | null> {
  const [platform] = await db
    .select({ id: schema.platforms.id })
    .from(schema.platforms)
    .where(eq(schema.platforms.slug, def.platformSlug))
    .limit(1);
  if (!platform) return null; // plataforma ainda não seedada — não deveria acontecer

  await db
    .insert(schema.contentEditions)
    .values({
      title: def.title,
      slug: def.slug,
      summary: def.summary,
      briefing: def.briefing,
      platformId: platform.id,
      editionDate: def.editionDate,
      status: def.status,
      reviewStatus: def.reviewStatus,
      reviewedAt: def.reviewedAt,
      reviewedBy: def.reviewedBy,
      publishedAt: def.publishedAt,
      contentExpiresAt: def.contentExpiresAt,
      isArchived: def.isArchived ?? false,
    })
    .onConflictDoNothing({
      target: [
        schema.contentEditions.platformId,
        schema.contentEditions.editionDate,
      ],
    });

  const [edition] = await db
    .select({ id: schema.contentEditions.id })
    .from(schema.contentEditions)
    .where(
      and(
        eq(schema.contentEditions.platformId, platform.id),
        eq(schema.contentEditions.editionDate, def.editionDate),
      ),
    )
    .limit(1);
  if (!edition) return null;

  // Idempotência: se já há trend_items para essa edição, os módulos já foram
  // seedados numa execução anterior — não duplica (trend_items não tem
  // constraint única própria, então o guard é feito aqui em código).
  const existing = await db
    .select({ c: dsql<number>`count(*)` })
    .from(schema.trendItems)
    .where(eq(schema.trendItems.editionId, edition.id));
  if (Number(existing[0]?.c ?? 0) > 0) return null;

  return { editionId: edition.id, platformId: platform.id };
}

async function seedDemoContent() {
  for (const def of DEMO_EDITIONS) {
    const seeded = await seedEdition(def);
    if (!seeded) continue;
    const { editionId, platformId } = seeded;

    if (def.trendItems.length) {
      await db
        .insert(schema.trendItems)
        .values(def.trendItems.map((t) => ({ ...t, editionId, platformId })));
    }
    if (def.headlines.length) {
      await db
        .insert(schema.headlines)
        .values(def.headlines.map((h) => ({ ...h, editionId })));
    }
    if (def.copyPatterns?.length) {
      await db
        .insert(schema.copyPatterns)
        .values(def.copyPatterns.map((c) => ({ ...c, editionId })));
    }
    if (def.visualPatterns?.length) {
      await db
        .insert(schema.visualPatterns)
        .values(def.visualPatterns.map((v) => ({ ...v, editionId })));
    }
    if (def.contentSuggestions?.length) {
      await db
        .insert(schema.contentSuggestions)
        .values(def.contentSuggestions.map((s) => ({ ...s, editionId })));
    }
    if (def.exploreReports?.length) {
      await db
        .insert(schema.exploreReports)
        .values(
          def.exploreReports.map((r) => ({ ...r, editionId, platformId })),
        );
    }
    if (def.comments?.length) {
      await db.insert(schema.editionComments).values(
        def.comments.map((c) => ({
          editionId,
          userId: randomUUID(),
          authorName: c.authorName,
          body: c.body,
        })),
      );
    }
  }
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
    await db
      .insert(schema.niches)
      .values({ name: name!, slug: slug! })
      .onConflictDoNothing({ target: schema.niches.slug });
  }
  for (const [name, slug] of TAGS) {
    await db
      .insert(schema.contentTags)
      .values({ name: name!, slug: slug! })
      .onConflictDoNothing({ target: schema.contentTags.slug });
  }

  await db
    .insert(schema.promptCategories)
    .values({
      name: "Copywriting",
      slug: "copywriting",
      description: "Prompts de copy",
    })
    .onConflictDoNothing({ target: schema.promptCategories.slug });
  const [cat] = await db
    .select()
    .from(schema.promptCategories)
    .where(eq(schema.promptCategories.slug, "copywriting"))
    .limit(1);
  const promptCount = await db
    .select({ c: dsql<number>`count(*)` })
    .from(schema.promptTemplates);
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
  // Fontes RSS reais (Google News por tópico — legal, sem scraping, sempre fresco).
  await ensureSource("Google News — Marketing de conteúdo", "rss", {
    url: "https://news.google.com/rss/search?q=marketing+de+conte%C3%BAdo&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  });
  await ensureSource("Google News — Redes sociais", "rss", {
    url: "https://news.google.com/rss/search?q=redes+sociais+marketing&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  });
  await ensureSource("Google News — Criadores de conteúdo", "rss", {
    url: "https://news.google.com/rss/search?q=criadores+de+conte%C3%BAdo&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  });
  await ensureSource("Google News — Tendências digitais", "rss", {
    url: "https://news.google.com/rss/search?q=tend%C3%AAncias+marketing+digital&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  });
  await ensureSource("Termos em alta (Trends)", "trends", {
    terms: [
      "IA no marketing",
      "vídeos curtos",
      "storytelling de marca",
      "prova social",
    ],
  });

  await seedDemoContent();

  console.log(
    `Seed concluído (${DEMO_EDITIONS.length} edições de demo entre publicadas/rascunho/agendada/arquivada).`,
  );
  await client.end();
}

main().catch(async (err) => {
  console.error("Seed falhou:", err);
  await client.end();
  process.exit(1);
});
