/**
 * Verificação E2E (camada de serviço) do fluxo de convite de equipe.
 * Roda contra o Postgres LOCAL (passe DATABASE_URL local), não o Supabase.
 * Uso: DATABASE_URL=postgres://postgres@localhost:54329/kabrito \
 *      node --conditions=react-server --import tsx tests/manual/verify-invite.ts
 */
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  createInvite,
  getInviteByToken,
  acceptInviteByToken,
  acceptPendingInvites,
  listMembers,
} from "@/server/admin/team";
import { organizations, profiles, organizationMembers } from "@/db/schema";

const db = getServiceDbClient();
let fail = 0;
const check = (l: string, c: boolean) => {
  console.log(`${c ? "✅" : "❌"} ${l}`);
  if (!c) fail++;
};

const ownerId = randomUUID();
const tokenInviteeId = randomUUID();
const autoInviteeId = randomUUID();
const suffix = ownerId.slice(0, 8);

// Setup: org + owner.
const [org] = await db
  .insert(organizations)
  .values({ name: "E2E Org", slug: `e2e-${suffix}`, ownerId })
  .returning();
await db.insert(profiles).values({ userId: ownerId, name: "Owner", email: `owner-${suffix}@e2e.test` });
await db.insert(organizationMembers).values({ organizationId: org!.id, userId: ownerId, role: "owner" });

try {
  // ── Fluxo 1: convite por TOKEN ──
  const { token } = await createInvite(org!.id, `token-${suffix}@e2e.test`, "member", ownerId);
  const inv = await getInviteByToken(token);
  check("convite encontrado pelo token (com nome da org)", inv?.orgName === "E2E Org");

  // O convidado cria conta depois (perfil existe) e aceita por token.
  await db.insert(profiles).values({ userId: tokenInviteeId, name: "Token", email: `token-${suffix}@e2e.test` });
  const acc = await acceptInviteByToken(token, tokenInviteeId);
  check("aceite por token ok", acc.ok === true);
  let members = await listMembers(org!.id);
  check("convidado entrou como member", members.some((m) => m.userId === tokenInviteeId && m.role === "member"));

  // Idempotência: aceitar de novo não duplica.
  await acceptInviteByToken(token, tokenInviteeId);
  members = await listMembers(org!.id);
  check("idempotente (sem duplicar membership)", members.filter((m) => m.userId === tokenInviteeId).length === 1);

  // ── Fluxo 2: auto-aceite por e-mail (cadastro/login) ──
  await createInvite(org!.id, `auto-${suffix}@e2e.test`, "admin", ownerId);
  await db.insert(profiles).values({ userId: autoInviteeId, name: "Auto", email: `auto-${suffix}@e2e.test` });
  const n = await acceptPendingInvites(autoInviteeId, `auto-${suffix}@e2e.test`);
  check("auto-aceite processou 1 convite", n === 1);
  members = await listMembers(org!.id);
  check("entrou como admin via auto-aceite", members.some((m) => m.userId === autoInviteeId && m.role === "admin"));
} finally {
  // Limpeza (cascade remove members/invites da org).
  await db.delete(organizations).where(eq(organizations.id, org!.id));
  await db.delete(profiles).where(inArray(profiles.userId, [ownerId, tokenInviteeId, autoInviteeId]));
}

console.log(fail === 0 ? "\n✅ INVITE E2E OK" : `\n❌ ${fail} falha(s)`);
process.exit(fail === 0 ? 0 : 1);
