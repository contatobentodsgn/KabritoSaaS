import "server-only";
import { eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  profiles,
  organizations,
  organizationMembers,
  subscriptions,
} from "@/db/schema";
import { slugify, shortSuffix } from "@/lib/utils/slug";
import { ensureSinglePlan } from "@/server/admin/billing";
import { acceptPendingInvites } from "@/server/admin/team";

/**
 * Provisionamento pós-cadastro (ROADMAP Fase 1 item 2): cria, EM TRANSAÇÃO,
 *   profiles + organizations (oculta) + organization_members(owner)
 *   + subscription(trialing) no plano único.
 *
 * É uma ROTINA ADMINISTRATIVA: usa o service-client (RLS bypass) porque o
 * usuário recém-criado ainda não tem org/assinatura para que a RLS permita
 * essas escritas. Isolado em server/admin/ conforme SECURITY_GUIDE §3.
 *
 * Idempotente: se o profile do usuário já existe, retorna o existente.
 */
export interface ProvisionResult {
  organizationId: string;
  profileId: string;
  created: boolean;
}

export async function provisionNewUser(params: {
  userId: string;
  email: string;
  name: string;
}): Promise<ProvisionResult> {
  const { userId, email, name } = params;
  const db = getServiceDbClient();

  // Idempotência: já provisionado?
  const existingProfile = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (existingProfile[0]) {
    const membership = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);
    return {
      profileId: existingProfile[0].id,
      organizationId: membership[0]?.organizationId ?? "",
      created: false,
    };
  }

  const plan = await ensureSinglePlan();
  const orgSlug = `${slugify(name) || "workspace"}-${shortSuffix(userId)}`;
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const result = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: `Workspace de ${name}`,
        slug: orgSlug,
        ownerId: userId,
      })
      .returning();
    if (!org) throw new Error("Falha ao criar organização.");

    const [profile] = await tx
      .insert(profiles)
      .values({ userId, name, email })
      .returning({ id: profiles.id });
    if (!profile) throw new Error("Falha ao criar profile.");

    await tx.insert(organizationMembers).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });

    await tx.insert(subscriptions).values({
      organizationId: org.id,
      planId: plan.id,
      subscriptionStatus: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
    });

    return { organizationId: org.id, profileId: profile.id, created: true };
  });

  // Auto-aceite de convites de equipe pendentes para este e-mail (best-effort).
  try {
    await acceptPendingInvites(userId, email);
  } catch (err) {
    console.error("[provisioning] acceptPendingInvites:", err);
  }
  return result;
}
