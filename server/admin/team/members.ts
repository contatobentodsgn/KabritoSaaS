import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { organizationMembers, profiles } from "@/db/schema";
import {
  type MemberRole,
  type AdminResult,
  NO_PERMISSION,
  actorRole,
  isManager,
} from "./shared";

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
};

/** Lista membros da org (join organization_members + profiles). */
export async function listMembers(
  orgId: string,
  actingUserId: string,
): Promise<TeamMember[]> {
  const db = getServiceDbClient();
  // Qualquer membro vê a equipe; não-membro não vê (evita vazar e-mails de outra org).
  if (!(await actorRole(db, orgId, actingUserId))) return [];

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
  actingUserId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  if (!isManager(await actorRole(db, orgId, actingUserId))) {
    return { ok: false, error: NO_PERMISSION };
  }

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
  actingUserId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  const actor = await actorRole(db, orgId, actingUserId);
  if (!isManager(actor)) {
    return { ok: false, error: NO_PERMISSION };
  }

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

  // Anti-escalada de privilégio: só o OWNER pode ATRIBUIR o papel owner OU
  // alterar o papel de quem já é owner. Sem isto, um admin se autopromoveria a
  // owner (a guarda do "último owner" abaixo só protege contra rebaixamento).
  if ((role === "owner" || current.role === "owner") && actor !== "owner") {
    return {
      ok: false,
      error: "Apenas o owner pode atribuir ou alterar o papel de um owner.",
    };
  }

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
  actingUserId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  if (!isManager(await actorRole(db, orgId, actingUserId))) {
    return { ok: false, error: NO_PERMISSION };
  }

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
  actingUserId: string,
): Promise<AdminResult> {
  const db = getServiceDbClient();
  if (!isManager(await actorRole(db, orgId, actingUserId))) {
    return { ok: false, error: NO_PERMISSION };
  }
  await db
    .insert(organizationMembers)
    .values({ organizationId: orgId, userId, role })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });
  return { ok: true };
}
