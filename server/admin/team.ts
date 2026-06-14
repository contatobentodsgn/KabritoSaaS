import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { organizationMembers, profiles, orgInvites, organizations } from "@/db/schema";

/**
 * ============================================================================
 * TEAM ADMIN — workspace de agência (gerência de membros).
 * ============================================================================
 *
 * ⚠️ Usa o SERVICE-CLIENT (RLS ignorada): pasta isolada server/admin/**.
 * A busca de usuário por e-mail é CROSS-USER (um perfil que não é o do
 * chamador) e as escritas de membership precisam ignorar a RLS — por isso
 * vivem aqui. A AUTORIZAÇÃO (quem pode chamar) é responsabilidade da Server
 * Action que chama estas funções (server/actions/team.ts), que confere o papel
 * do usuário na org ANTES de invocar qualquer coisa daqui.
 *
 * Toda função recebe orgId já DERIVADO do contexto autenticado (anti-IDOR);
 * nunca confiar em org vinda do frontend.
 */

export type MemberRole = "owner" | "admin" | "member";

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
};

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Lista membros da org (join organization_members + profiles). */
export async function listMembers(orgId: string): Promise<TeamMember[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({
      userId: organizationMembers.userId,
      name: profiles.name,
      email: profiles.email,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(profiles, eq(profiles.userId, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, orgId));

  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    role: r.role,
  }));
}

/** Conta quantos owners a org tem (guarda do "último owner"). */
async function countOwners(
  db: ReturnType<typeof getServiceDbClient>,
  orgId: string,
): Promise<number> {
  const owners = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.role, "owner"),
      ),
    );
  return owners.length;
}

/**
 * Convida por e-mail: encontra o perfil; se não existir, devolve erro amigável.
 * Caso exista, insere a membership (idempotente por (org, user)).
 */
export async function addMemberByEmail(
  orgId: string,
  email: string,
  role: Exclude<MemberRole, "owner">,
): Promise<AdminResult> {
  const db = getServiceDbClient();

  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (!profile) {
    return { ok: false, error: "Esse e-mail ainda não tem conta no Kabrito." };
  }

  await db
    .insert(organizationMembers)
    .values({ organizationId: orgId, userId: profile.userId, role })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });

  return { ok: true };
}

/**
 * Troca o papel de um membro. Protege o owner: não permite REBAIXAR o último
 * owner da org (deixaria a org sem dono).
 */
export async function setMemberRole(
  orgId: string,
  userId: string,
  role: MemberRole,
): Promise<AdminResult> {
  const db = getServiceDbClient();

  const [current] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!current) return { ok: false, error: "Membro não encontrado." };

  // Rebaixando um owner: só se houver outro owner.
  if (current.role === "owner" && role !== "owner") {
    const owners = await countOwners(db, orgId);
    if (owners <= 1) {
      return {
        ok: false,
        error: "A organização precisa de pelo menos um owner.",
      };
    }
  }

  await db
    .update(organizationMembers)
    .set({ role })
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    );

  return { ok: true };
}

/**
 * Remove um membro. Protege o owner: não permite remover o último owner.
 */
export async function removeMember(
  orgId: string,
  userId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();

  const [current] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!current) return { ok: false, error: "Membro não encontrado." };

  if (current.role === "owner") {
    const owners = await countOwners(db, orgId);
    if (owners <= 1) {
      return {
        ok: false,
        error: "Não é possível remover o último owner da organização.",
      };
    }
  }

  await db
    .delete(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    );

  return { ok: true };
}

/* ===========================================================================
 * CONVITES por e-mail (pendências) — para quem ainda não tem conta Kabrito.
 * =========================================================================== */

/** Acha o userId pelo e-mail (case-insensitive). Cross-user → service-client. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const db = getServiceDbClient();
  const [p] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(sql`lower(${profiles.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return p?.userId ?? null;
}

/** Adiciona um usuário existente (por id) como membro (idempotente). */
export async function addMemberById(
  orgId: string,
  userId: string,
  role: Exclude<MemberRole, "owner">,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  await db
    .insert(organizationMembers)
    .values({ organizationId: orgId, userId, role })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });
  return { ok: true };
}

export interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  createdAt: Date;
}

export async function listPendingInvites(orgId: string): Promise<PendingInvite[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      createdAt: orgInvites.createdAt,
    })
    .from(orgInvites)
    .where(and(eq(orgInvites.organizationId, orgId), isNull(orgInvites.acceptedAt)));
  return rows;
}

/** Cria (ou reusa) um convite pendente e devolve o token. */
export async function createInvite(
  orgId: string,
  email: string,
  role: Exclude<MemberRole, "owner">,
  invitedBy: string,
): Promise<{ token: string }> {
  const db = getServiceDbClient();
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

export async function cancelInvite(orgId: string, inviteId: string): Promise<AdminResult> {
  const db = getServiceDbClient();
  await db
    .delete(orgInvites)
    .where(and(eq(orgInvites.id, inviteId), eq(orgInvites.organizationId, orgId)));
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
export async function getInviteByToken(token: string): Promise<TokenInvite | null> {
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
 * Aceita um convite por TOKEN (link). Qualquer usuário logado com o link entra —
 * o token é a credencial. Idempotente. O userId vem do contexto (na action).
 */
export async function acceptInviteByToken(
  token: string,
  userId: string,
): Promise<{ ok: true; orgName: string } | { ok: false; error: string }> {
  const db = getServiceDbClient();
  const invite = await getInviteByToken(token);
  if (!invite) return { ok: false, error: "Convite inválido ou expirado." };

  await db
    .insert(organizationMembers)
    .values({ organizationId: invite.organizationId, userId, role: invite.role })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });
  if (!invite.acceptedAt) {
    await db.update(orgInvites).set({ acceptedAt: new Date() }).where(eq(orgInvites.id, invite.id));
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
    .where(and(eq(orgInvites.email, mail.toLowerCase()), isNull(orgInvites.acceptedAt)));

  let accepted = 0;
  for (const inv of invites) {
    await db
      .insert(organizationMembers)
      .values({ organizationId: inv.organizationId, userId, role: inv.role })
      .onConflictDoNothing({
        target: [organizationMembers.organizationId, organizationMembers.userId],
      });
    await db.update(orgInvites).set({ acceptedAt: new Date() }).where(eq(orgInvites.id, inv.id));
    accepted++;
  }
  return accepted;
}
