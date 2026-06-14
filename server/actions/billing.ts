"use server";

import { getCurrentUser, getCurrentOrganization } from "@/server/auth/session";
import {
  STRIPE_ENABLED,
  createCheckoutSession,
} from "@/server/admin/stripe";

/**
 * Server Action de billing: inicia o Checkout do Stripe para a organização do
 * usuário autenticado. A org vem SEMPRE do contexto (anti-IDOR, SECURITY_GUIDE
 * §4) — nunca do frontend. Sem chaves, devolve erro gracioso (no-op).
 */

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutAction(
  billingCycle: "monthly" | "annual",
): Promise<CheckoutResult> {
  if (!STRIPE_ENABLED) {
    return { ok: false, error: "Stripe não configurado." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Faça login para assinar." };
  }

  const org = await getCurrentOrganization();
  if (!org) {
    return { ok: false, error: "Workspace não encontrado." };
  }

  try {
    const url = await createCheckoutSession({
      organizationId: org.id,
      billingCycle,
      customerEmail: user.email ?? undefined,
    });
    return { ok: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Não foi possível iniciar o checkout.";
    return { ok: false, error: message };
  }
}
