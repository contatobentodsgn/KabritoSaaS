import "server-only";
import { desc, eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  plans,
  profiles,
  organizationMembers,
  subscriptions,
} from "@/db/schema";
import { SINGLE_PLAN_SLUG, AUDIT_ACTIONS } from "@/lib/constants";
import { recordSystemAudit } from "@/server/admin/audit-system";
import type { Plan } from "@/types";

/**
 * Rotina administrativa: garante a existência do PLANO ÚNICO (definitivo).
 * Usa o service-client (isolado). Plano único => `plans` tem UMA linha ativa
 * (mensal + anual com desconto = mesmo acesso, não tiers).
 */
export async function ensureSinglePlan(): Promise<Plan> {
  const db = getServiceDbClient();
  const existing = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, SINGLE_PLAN_SLUG))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(plans)
    .values({
      name: "Plano Único",
      slug: SINGLE_PLAN_SLUG,
      priceMonthly: "49.00",
      priceAnnual: "470.00",
      billingCycle: "monthly",
      features: {
        editorial_diaria: true,
        favoritos: true,
        prompts: true,
        device_limit: 2,
      },
      retentionDays: 60,
      isActive: true,
    })
    .onConflictDoNothing({ target: plans.slug })
    .returning();

  if (inserted[0]) return inserted[0];
  // corrida: outra requisição criou — relê
  const again = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, SINGLE_PLAN_SLUG))
    .limit(1);
  if (!again[0]) throw new Error("Falha ao garantir o plano único.");
  return again[0];
}

/**
 * CONCESSÃO MANUAL de acesso (MVP — sem Stripe). Marca a assinatura da org do
 * usuário como `active` por `days` dias (cria a assinatura se não existir).
 * Rotina administrativa: service-client isolado. (ROADMAP Fase 8 item 2)
 */
export interface GrantResult {
  ok: boolean;
  message: string;
}

export async function grantAccessByEmail(
  email: string,
  days = 365,
): Promise<GrantResult> {
  const db = getServiceDbClient();
  // Mesmo raciocínio do upsertOrgSubscription (server/admin/stripe.ts):
  // ensureSinglePlan() já rodava incondicionalmente antes de saber se o
  // profile existe — paralelizar com essa leitura não desperdiça nada a mais.
  const [plan, [profile]] = await Promise.all([
    ensureSinglePlan(),
    db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1),
  ]);
  if (!profile)
    return { ok: false, message: `Usuário não encontrado: ${email}` };

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, profile.userId))
    .limit(1);
  if (!membership) return { ok: false, message: "Usuário sem organização." };

  const now = new Date();
  const end = new Date(now.getTime() + days * 86_400_000);

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, membership.organizationId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        subscriptionStatus: "active",
        currentPeriodStart: now,
        currentPeriodEnd: end,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      organizationId: membership.organizationId,
      planId: plan.id,
      subscriptionStatus: "active",
      currentPeriodStart: now,
      currentPeriodEnd: end,
    });
  }
  // Trilha de auditoria: concessão manual de acesso (privilégio de billing).
  await recordSystemAudit({
    action: AUDIT_ACTIONS.ACCESS_GRANTED,
    userId: profile.userId,
    organizationId: membership.organizationId,
    entityType: "subscription",
    metadata: { email, days, until: end.toISOString() },
  });
  return { ok: true, message: `Acesso ativo para ${email} por ${days} dias.` };
}
