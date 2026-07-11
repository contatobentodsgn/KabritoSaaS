import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  orgInvites,
  organizations,
  profiles,
  organizationMembers,
} from "@/db/schema";
import {
  type MemberRole,
  type AdminResult,
  NO_PERMISSION,
  actorRole,
  isManager,
} from "./shared";
import type { ActionResult } from "@/server/actions/types";

export type AcceptInviteResult = ActionResult<{ orgName: string }>;

/* ===========================================================================
 * CONVITES por e-mail (pendências) — para quem ainda não tem conta Kabrito.
 * =========================================================================== */

export interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  createdAt: Date;
}

export async function listPendingInvites(
  orgId: string,
  actingUserId: string,
): Promise<PendingInvite[]> {
  const db = getServiceDbClient();
  // Convites só são vistos por owner/admin (espelha a RLS de org_invites).
  if (!isManager(await actorRole(db, orgId, actingUserId))) return [];
  const rows = await db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      createdAt: orgInvites.createdAt,
    })
    .from(orgInvites)
    .where(
      and(eq(orgInvites.organizationId, orgId), isNull(orgInvites.acceptedAt)),
    );
  return rows;
}

/**
 * Cria (ou reusa) um convite pendente e devolve o token. `invitedBy` é o ATOR —
 * usado também como backstop de autorização (precisa ser owner/admin da org).
 */
export async function createInvite(
  orgId: string,
  email: string,
  role: Exclude<MemberRole, "owner">,
  invitedBy: string,
): Promise<{ token: string }> {
  const db = getServiceDbClient();
  if (!isManager(await actorRole(db, orgId, invitedBy))) {
    throw new Error(NO_PERMISSION);
  }
  const lower = email.toLowerCase();
  const [existing] = await db
    .select({ token: orgInvites.token })
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.organizationId, orgId),
        eq(orgInvites.email, lower),
        isNull(orgInvites.acceptedAt),
      ),
    )
    .limit(1);
  if (existing) return { token: existing.token };

  const token = randomBytes(24).toString("hex");
  await db
    .insert(orgInvites)
    .values({ organizationId: orgId, email: lower, role, token, invitedBy });
  return { token };
}

export async function cancelInvite(
  orgId: string,
  inviteId: string,
  actingUserId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  if (!isManager(await actorRole(db, orgId, actingUserId))) {
    return { ok: false, error: NO_PERMISSION };
  }
  await db
    .delete(orgInvites)
    .where(
      and(eq(orgInvites.id, inviteId), eq(orgInvites.organizationId, orgId)),
    );
  return { ok: true };
}

export interface TokenInvite {
  id: string;
  organizationId: string;
  orgName: string;
  email: string;
  role: MemberRole;
  acceptedAt: Date | null;
}

/** Busca um convite pelo token (capability link), com o nome da org. */
export async function getInviteByToken(
  token: string,
): Promise<TokenInvite | null> {
  const db = getServiceDbClient();
  const [row] = await db
    .select({
      id: orgInvites.id,
      organizationId: orgInvites.organizationId,
      orgName: organizations.name,
      email: orgInvites.email,
      role: orgInvites.role,
      acceptedAt: orgInvites.acceptedAt,
    })
    .from(orgInvites)
    .innerJoin(organizations, eq(organizations.id, orgInvites.organizationId))
    .where(eq(orgInvites.token, token))
    .limit(1);
  return row ?? null;
}

/**
 * Aceita um convite por TOKEN (link). O token + o E-MAIL do convite são a
 * credencial: o usuário logado só entra se o e-mail dele bater com o do convite.
 * Isso impede que um link vazado/encaminhado adicione outra pessoa à org
 * (join cross-tenant). Idempotente. O userId vem do contexto (na action).
 */
export async function acceptInviteByToken(
  token: string,
  userId: string,
): Promise<AcceptInviteResult> {
  const db = getServiceDbClient();
  const invite = await getInviteByToken(token);
  if (!invite) return { ok: false, error: "Convite inválido ou expirado." };

  // O convite é vinculado ao e-mail destinatário: confere contra o usuário logado.
  const [profile] = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile || profile.email.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      ok: false,
      error:
        "Este convite foi enviado para outro e-mail. Entre com esse e-mail para aceitar.",
    };
  }

  await db
    .insert(organizationMembers)
    .values({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });
  if (!invite.acceptedAt) {
    await db
      .update(orgInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(orgInvites.id, invite.id));
  }
  return { ok: true, orgName: invite.orgName };
}

/**
 * Aceita TODOS os convites pendentes do e-mail do usuário (chamado no cadastro e
 * no login). Adiciona a membership e marca o convite como aceito. Idempotente.
 */
export async function acceptPendingInvites(
  userId: string,
  email?: string,
): Promise<number> {
  const db = getServiceDbClient();
  let mail = email;
  if (!mail) {
    const [p] = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    mail = p?.email;
  }
  if (!mail) return 0;

  const invites = await db
    .select()
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.email, mail.toLowerCase()),
        isNull(orgInvites.acceptedAt),
      ),
    );

  let accepted = 0;
  for (const inv of invites) {
    await db
      .insert(organizationMembers)
      .values({ organizationId: inv.organizationId, userId, role: inv.role })
      .onConflictDoNothing({
        target: [
          organizationMembers.organizationId,
          organizationMembers.userId,
        ],
      });
    await db
      .update(orgInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(orgInvites.id, inv.id));
    accepted++;
  }
  return accepted;
}
