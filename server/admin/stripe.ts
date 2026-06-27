import "server-only";
import Stripe from "stripe";
import { desc, eq } from "drizzle-orm";
import { serverEnv, requireEnv } from "@/server/env";
import { getServiceDbClient } from "@/server/db/service-client";
import { subscriptions, organizations } from "@/db/schema";
import { ensureSinglePlan } from "@/server/admin/billing";

/**
 * ============================================================================
 * STRIPE — billing real (MVP 3). (TECHNICAL_SPEC §10, SECURITY_GUIDE §8)
 * ============================================================================
 * Tudo aqui é NO-OP gracioso sem chaves: `STRIPE_ENABLED` controla o gate e o
 * build/runtime continuam OK mesmo sem STRIPE_SECRET_KEY. As escritas em
 * `subscriptions` passam pelo service-client (rotina de sistema isolada —
 * webhook é tráfego de servidor, não de usuário autenticado, então não há JWT
 * e a RLS não se aplica).
 */

/** Billing ligado só quando há chave secreta configurada. */
export const STRIPE_ENABLED = !!serverEnv.STRIPE_SECRET_KEY;

let _stripe: Stripe | null = null;

/** Cliente Stripe (singleton). Exige STRIPE_SECRET_KEY — só chame com gate. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = requireEnv("STRIPE_SECRET_KEY");
  // Sem `apiVersion` explícito: usa a versão fixada pelo SDK instalado.
  _stripe = new Stripe(key);
  return _stripe;
}

export interface CheckoutSessionParams {
  organizationId: string;
  billingCycle: "monthly" | "annual";
  customerEmail?: string | undefined;
}

/**
 * Cria uma Checkout Session de assinatura (plano único, mensal ou anual) e
 * devolve a URL hospedada pelo Stripe. `metadata.organizationId` é o que liga o
 * pagamento à organização no webhook.
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<string> {
  if (!STRIPE_ENABLED) {
    throw new Error("Stripe não configurado (STRIPE_SECRET_KEY ausente).");
  }
  const price =
    params.billingCycle === "annual"
      ? requireEnv("STRIPE_PRICE_ANNUAL")
      : requireEnv("STRIPE_PRICE_MONTHLY");
  const appUrl = requireEnv("APP_URL");

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/settings?billing=ok`,
    cancel_url: `${appUrl}/settings`,
    metadata: { organizationId: params.organizationId },
    // Propaga a org para a própria subscription (eventos subscription.* trazem
    // só a subscription, não a session — sem isto perderíamos o vínculo).
    subscription_data: { metadata: { organizationId: params.organizationId } },
    ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
    client_reference_id: params.organizationId,
  });

  if (!session.url) {
    throw new Error("Stripe não retornou a URL da Checkout Session.");
  }
  return session.url;
}

/**
 * Valida a assinatura do webhook e devolve o evento tipado. NUNCA processe um
 * payload sem passar por aqui (SECURITY_GUIDE §8). Lança se a assinatura falha.
 */
export function verifyAndConstructEvent(
  payload: string,
  signature: string | null,
): Stripe.Event {
  if (!signature) {
    throw new Error("Cabeçalho stripe-signature ausente.");
  }
  const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

/** Status interno do Stripe → nosso enum subscription_status. */
function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "trialing" | "active" | "past_due" | "canceled" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      // canceled, incomplete, incomplete_expired, paused...
      return "canceled";
  }
}

/**
 * Faz upsert da assinatura da organização (uma linha por org; reusa a mais
 * recente se existir). Idempotente: aplicar o mesmo evento N vezes converge no
 * mesmo estado. Escrita via service-client (sistema isolado).
 */
async function upsertOrgSubscription(input: {
  organizationId: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  customerId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  // Defesa-em-profundidade (G6): organizationId vem da metadata do Stripe. Mesmo
  // com o webhook validado por HMAC, não gravamos assinatura para uma org que
  // não existe — evita linha órfã / vínculo forjado se a metadata for adulterada.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.organizationId,
    )
  ) {
    console.warn("[stripe] evento ignorado: organizationId mal-formado.");
    return;
  }
  const db = getServiceDbClient();
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);
  if (!org) {
    console.warn(
      `[stripe] evento ignorado: organização ${input.organizationId} não existe.`,
    );
    return;
  }
  const plan = await ensureSinglePlan();

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        subscriptionStatus: input.status,
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.currentPeriodStart !== undefined
          ? { currentPeriodStart: input.currentPeriodStart }
          : {}),
        ...(input.currentPeriodEnd !== undefined
          ? { currentPeriodEnd: input.currentPeriodEnd }
          : {}),
      })
      .where(eq(subscriptions.id, existing.id));
    return;
  }

  await db.insert(subscriptions).values({
    organizationId: input.organizationId,
    planId: plan.id,
    subscriptionStatus: input.status,
    customerId: input.customerId ?? null,
    currentPeriodStart: input.currentPeriodStart ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
  });
}

/** Extrai a organizationId da metadata de uma subscription do Stripe. */
function orgIdFromSubscription(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.organizationId;
  return typeof fromMeta === "string" && fromMeta.length > 0 ? fromMeta : null;
}

/** Início/fim do período cobrado, a partir do primeiro item da subscription. */
function periodFromSubscription(sub: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = sub.items?.data?.[0];
  const start = item?.current_period_start ?? null;
  const end = item?.current_period_end ?? null;
  return {
    start: start ? new Date(start * 1000) : null,
    end: end ? new Date(end * 1000) : null,
  };
}

/**
 * Aplica o efeito de um evento do Stripe sobre `subscriptions`. Idempotente.
 * Eventos não relevantes são ignorados (no-op, retorna sem erro).
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const organizationId =
        session.metadata?.organizationId ??
        (typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : null);
      if (!organizationId) return;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null);
      await upsertOrgSubscription({
        organizationId,
        status: "active",
        customerId,
      });
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const organizationId = orgIdFromSubscription(sub);
      if (!organizationId) return;
      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : (sub.customer?.id ?? null);
      const { start, end } = periodFromSubscription(sub);
      await upsertOrgSubscription({
        organizationId,
        status: mapStripeStatus(sub.status),
        customerId,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      });
      return;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const organizationId = orgIdFromSubscription(sub);
      if (!organizationId) return;
      await upsertOrgSubscription({
        organizationId,
        status: "canceled",
      });
      return;
    }

    default:
      // Evento não tratado: no-op gracioso.
      return;
  }
}
