"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  getCurrentUser,
  getCurrentProfile,
  getCurrentOrganization,
  getCurrentOrgRole,
} from "@/server/auth/session";
import {
  addMemberSchema,
  setRoleSchema,
  removeSchema,
} from "@/lib/validations/team";
import {
  findUserIdByEmail,
  addMemberById,
  createInvite,
  cancelInvite,
  acceptInviteByToken,
  setMemberRole,
  removeMember,
} from "@/server/admin/team";
import { sendInviteEmail } from "@/server/admin/notify";
import { recordAudit } from "@/server/audit/log";
import { consume } from "@/server/rate-limit";
import { AUDIT_ACTIONS } from "@/lib/constants";

/**
 * Server Actions do workspace de agência. Cada ação:
 *  1. valida a entrada com Zod;
 *  2. confere que o chamador é owner|admin na PRÓPRIA org;
 *  3. deriva o orgId do CONTEXTO autenticado (anti-IDOR — nunca do input);
 *  4. delega a escrita ao server/admin/team (service-client, isolado).
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const TEAM_PATH = "/settings/equipe";

/** Garante owner|admin e devolve o orgId derivado do contexto. */
async function requireManager(): Promise<
  { ok: true; orgId: string; userId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const org = await getCurrentOrganization();
  if (!org) return { ok: false, error: "Nenhum workspace ativo." };

  const role = await getCurrentOrgRole();
  if (role !== "owner" && role !== "admin") {
    return { ok: false, error: "Você não tem permissão para gerenciar a equipe." };
  }

  return { ok: true, orgId: org.id, userId: user.id };
}

export type InviteResult =
  | { ok: true; status: "added" | "invited" }
  | { ok: false; error: string };

/**
 * Convida um membro por e-mail. Se o e-mail já tem conta Kabrito → adiciona
 * direto à equipe. Senão → cria um convite pendente e dispara o e-mail; a pessoa
 * entra automaticamente ao se cadastrar com esse e-mail (auto-aceite).
 */
export async function addMemberAction(input: unknown): Promise<InviteResult> {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const ctx = await requireManager();
  if (!ctx.ok) return ctx;

  // Dispara e-mail externo → rate-limit por usuário (anti-abuso/flood).
  if (!(await consume("invite", ctx.userId)).success) {
    return { ok: false, error: "Muitos convites em pouco tempo. Aguarde um instante." };
  }

  const { email, role } = parsed.data;
  const existingUserId = await findUserIdByEmail(email);
  if (existingUserId) {
    await addMemberById(ctx.orgId, existingUserId, role, ctx.userId);
    await recordAudit({
      action: AUDIT_ACTIONS.MEMBER_ADDED,
      entityType: "organization_member",
      entityId: existingUserId,
      metadata: { email, role },
    });
    revalidatePath(TEAM_PATH);
    return { ok: true, status: "added" };
  }

  // Sem conta ainda → convite pendente + e-mail (best-effort) com link de token.
  const { token } = await createInvite(ctx.orgId, email, role, ctx.userId);
  await recordAudit({
    action: AUDIT_ACTIONS.INVITE_CREATED,
    entityType: "org_invite",
    metadata: { email, role },
  });
  const [org, inviter] = await Promise.all([
    getCurrentOrganization(),
    getCurrentProfile(),
  ]);
  await sendInviteEmail({
    to: email,
    orgName: org?.name ?? "sua equipe",
    inviterName: inviter?.name,
    token,
  });
  revalidatePath(TEAM_PATH);
  return { ok: true, status: "invited" };
}

/** Aceita um convite por token (a pessoa logada com o link entra na org). */
export async function acceptInviteAction(
  token: unknown,
): Promise<{ ok: true; orgName: string } | { ok: false; error: string }> {
  const parsed = z.string().min(10).safeParse(token);
  if (!parsed.success) return { ok: false, error: "Token inválido." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para aceitar o convite." };

  const res = await acceptInviteByToken(parsed.data, user.id);
  if (res.ok) {
    await recordAudit({
      action: AUDIT_ACTIONS.INVITE_ACCEPTED,
      entityType: "org_invite",
      metadata: { orgName: res.orgName },
    });
    revalidatePath("/dashboard");
    revalidatePath(TEAM_PATH);
  }
  return res;
}

/** Cancela um convite pendente (owner|admin). */
export async function cancelInviteAction(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ inviteId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const ctx = await requireManager();
  if (!ctx.ok) return ctx;

  const res = await cancelInvite(ctx.orgId, parsed.data.inviteId, ctx.userId);
  if (res.ok) {
    await recordAudit({
      action: AUDIT_ACTIONS.INVITE_CANCELLED,
      entityType: "org_invite",
      entityId: parsed.data.inviteId,
    });
    revalidatePath(TEAM_PATH);
  }
  return res;
}

/** Troca o papel de um membro (owner|admin|member), com proteção do último owner. */
export async function setMemberRoleAction(input: unknown): Promise<ActionResult> {
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const ctx = await requireManager();
  if (!ctx.ok) return ctx;

  const res = await setMemberRole(ctx.orgId, parsed.data.userId, parsed.data.role, ctx.userId);
  if (res.ok) {
    await recordAudit({
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
      entityType: "organization_member",
      entityId: parsed.data.userId,
      metadata: { role: parsed.data.role },
    });
    revalidatePath(TEAM_PATH);
  }
  return res;
}

/** Remove um membro, com proteção do último owner. */
export async function removeMemberAction(input: unknown): Promise<ActionResult> {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entrada inválida." };

  const ctx = await requireManager();
  if (!ctx.ok) return ctx;

  const res = await removeMember(ctx.orgId, parsed.data.userId, ctx.userId);
  if (res.ok) {
    await recordAudit({
      action: AUDIT_ACTIONS.MEMBER_REMOVED,
      entityType: "organization_member",
      entityId: parsed.data.userId,
    });
    revalidatePath(TEAM_PATH);
  }
  return res;
}
