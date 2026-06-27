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
 * DEFESA-EM-PROFUNDIDADE (G5): como a RLS está desligada aqui, cada função
 * org-scoped REVALIDA internamente o papel do ATOR (`actingUserId`) na org via
 * `actorRole()` — não confia cegamente no `orgId` recebido. Assim, um caller
 * futuro que esqueça o gate não vira um IDOR cross-tenant. O orgId continua
 * vindo do contexto autenticado; nunca do frontend.
 */

export type MemberRole = "owner" | "admin" | "member";

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
};

export type AdminResult = { ok: true } | { ok: false; error: string };

const NO_PERMISSION = "Sem permissão para gerenciar esta organização." as const;

/**
 * Backstop anti-IDOR (G5): papel do ATOR na org, lido via service-client.
 * null = não é membro. As Server Actions já conferem antes, mas como a RLS está
 * ignorada aqui, revalidamos — um caller sem gate seria um IDOR direto.
 */
async function actorRole(
  db: ReturnType<typeof getServiceDbClient>,
  orgId: string,
  actingUserId: string,
): Promise<MemberRole | null> {
  const [m] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, actingUserId),
      ),
    )
    .limit(1);
  return m?.role ?? null;
}

function isManager(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

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
    .where(and(eq(orgInvites.organizationId, orgId), isNull(orgInvites.acceptedAt)));
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
 * Aceita um convite por TOKEN (link). O token + o E-MAIL do convite são a
 * credencial: o usuário logado só entra se o e-mail dele bater com o do convite.
 * Isso impede que um link vazado/encaminhado adicione outra pessoa à org
 * (join cross-tenant). Idempotente. O userId vem do contexto (na action).
 */
export async function acceptInviteByToken(
  token: string,
  userId: string,
): Promise<{ ok: true; orgName: string } | { ok: false; error: string }> {
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
      error: "Este convite foi enviado para outro e-mail. Entre com esse e-mail para aceitar.",
    };
  }

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
