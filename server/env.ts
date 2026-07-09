import "server-only";
import { numEnv } from "@/lib/parse-num";

/**
 * Acesso centralizado aos SEGREDOS DE SERVIDOR.
 *
 * `import "server-only"` faz o build do Next FALHAR se este módulo for importado,
 * direta ou transitivamente, em um componente client. É a primeira linha de
 * defesa do item "nada secreto em componente client" (SECURITY_GUIDE §5).
 *
 * O ESLint custom rule `no-secrets-in-client` é a segunda linha (lint/CI).
 */

export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL ?? "claude-3-5-sonnet-latest",
  // Rate-limit distribuído (Upstash Redis REST). Vazias = cai no limiter em
  // memória por instância (dev local / não configurado). Ambas presentes = ativa.
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  // Provider de IA — desacopla de um fornecedor único:
  //  - AI_PROVIDER: "anthropic" (API nativa) | "openai" (Chat Completions compatível)
  //    Vazio = auto (openai se AI_BASE_URL setado, senão anthropic).
  //  - AI_BASE_URL: base da API OpenAI-compatível (OpenAI, OpenRouter, Groq, Gemini-compat,
  //    DeepSeek, Mistral, local…). Ex.: https://openrouter.ai/api/v1
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_BASE_URL: process.env.AI_BASE_URL,
  AI_RUN_COST_CAP_USD: numEnv(process.env.AI_RUN_COST_CAP_USD, 2.0),
  AI_RUN_TOKEN_CAP: numEnv(process.env.AI_RUN_TOKEN_CAP, 200000),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM:
    process.env.EMAIL_FROM ?? "Inteligência Criativa <digest@example.com>",
  SENTRY_DSN: process.env.SENTRY_DSN,
  DEVICE_LIMIT: numEnv(process.env.DEVICE_LIMIT, 2),
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  // Stripe (MVP 3) — billing real. Vazio = billing desligado (concessão manual).
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_ANNUAL: process.env.STRIPE_PRICE_ANNUAL,
} as const;

type ServerEnvKey = keyof typeof serverEnv;

/** Lê um segredo obrigatório; lança erro claro se ausente (em vez de falha silenciosa). */
export function requireEnv(key: ServerEnvKey): string {
  const value = serverEnv[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${key}. Veja .env.example.`,
    );
  }
  return String(value);
}
