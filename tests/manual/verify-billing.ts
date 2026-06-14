/**
 * Verificação MANUAL (Fase 8): concessão manual de acesso (sem Stripe).
 * Provisiona um usuário (trialing) → grant → assinatura ACTIVE.
 * Uso: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-billing.ts
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { provisionNewUser } from "@/server/admin/provisioning";
import { grantAccessByEmail } from "@/server/admin/billing";
import { getServiceDbClient } from "@/server/db/service-client";
import { subscriptions, organizationMembers } from "@/db/schema";

const db = getServiceDbClient();
let failures = 0;
const check = (l: string, c: boolean) => {
  console.log(`${c ? "✅" : "❌"} ${l}`);
  if (!c) failures++;
};

const userId = randomUUID();
const email = `bill-${userId.slice(0, 8)}@example.com`;
const prov = await provisionNewUser({ userId, email, name: "Billing Test" });

const [m] = await db
  .select()
  .from(organizationMembers)
  .where(eq(organizationMembers.userId, userId));
const [before] = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.organizationId, m!.organizationId));
check("provisionado com trialing", before?.subscriptionStatus === "trialing");

const r = await grantAccessByEmail(email, 30);
console.log("grant:", r.message);
check("grant ok", r.ok);

const [after] = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.organizationId, m!.organizationId));
check("assinatura agora ACTIVE", after?.subscriptionStatus === "active");
check("período futuro", !!after?.currentPeriodEnd && new Date(after.currentPeriodEnd) > new Date());

void prov;
console.log(failures === 0 ? "\n✅ BILLING OK" : `\n❌ ${failures} falha(s)`);
process.exit(failures === 0 ? 0 : 1);
