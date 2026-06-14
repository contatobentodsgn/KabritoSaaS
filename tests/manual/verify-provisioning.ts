/**
 * Verificação MANUAL (Fase 1): roda o provisionamento transacional contra o
 * Postgres local e confere que profile+org+member+subscription foram criados.
 * Executar: node --conditions=react-server --env-file=.env.local --import tsx tests/manual/verify-provisioning.ts
 */
import { randomUUID } from "node:crypto";
import { provisionNewUser } from "@/server/admin/provisioning";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  profiles,
  organizations,
  organizationMembers,
  subscriptions,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const userId = randomUUID();
const email = `verify-${userId.slice(0, 8)}@example.com`;

const res = await provisionNewUser({ userId, email, name: "Teste Provisionamento" });
console.log("provisionNewUser:", res);

const db = getServiceDbClient();
const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
const [m] = await db
  .select()
  .from(organizationMembers)
  .where(eq(organizationMembers.userId, userId));
const [o] = await db
  .select()
  .from(organizations)
  .where(eq(organizations.id, res.organizationId));
const [s] = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.organizationId, res.organizationId));

console.log("profile:", p ? { name: p.name, email: p.email } : null);
console.log("org:", o ? { name: o.name, slug: o.slug, ownerId: o.ownerId } : null);
console.log("member role:", m?.role);
console.log("subscription:", s ? { status: s.subscriptionStatus, planId: s.planId } : null);

const ok = !!(p && o && m?.role === "owner" && s?.subscriptionStatus === "trialing");
console.log(ok ? "\n✅ PROVISIONAMENTO OK (atômico)" : "\n❌ FALHOU");

// idempotência: rodar de novo não duplica
const res2 = await provisionNewUser({ userId, email, name: "Teste Provisionamento" });
console.log("idempotente (created=false esperado):", res2.created === false ? "OK" : "FALHOU");

process.exit(ok && res2.created === false ? 0 : 1);
