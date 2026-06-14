"use server";

import { getCurrentUser } from "@/server/auth/session";
import { hasActiveSubscription } from "@/server/permissions";
import { consume } from "@/server/rate-limit";
import { recordAudit } from "@/server/audit/log";
import { adaptInputSchema } from "@/lib/validations/translate";
import { adaptToNiche, type AdaptResult } from "@/server/services/translate";
import { AUDIT_ACTIONS } from "@/lib/constants";

/**
 * Ação de geração SOB DEMANDA "Adaptar ao meu nicho".
 * Defesas: autenticação + assinatura ativa + RATE LIMIT POR USUÁRIO
 * (PROJECT §6/§9) + Zod na entrada. A saída é validada no service.
 */
export async function adaptAction(input: unknown): Promise<AdaptResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  if (!(await hasActiveSubscription())) {
    return { ok: false, error: "Ative sua assinatura para usar a adaptação." };
  }

  // Rate limit por usuário (custo de IA sob demanda).
  const { success } = await consume("generation", user.id);
  if (!success) {
    return {
      ok: false,
      error: "Você atingiu o limite de gerações por minuto. Aguarde um instante.",
    };
  }

  const parsed = adaptInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const result = await adaptToNiche(parsed.data);
  if (result.ok) {
    await recordAudit({
      action: AUDIT_ACTIONS.GENERATION_ADAPT,
      metadata: { niche: parsed.data.niche, platform: parsed.data.platform },
    });
  }
  return result;
}
