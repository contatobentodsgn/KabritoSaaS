import "server-only";
import { and, eq } from "drizzle-orm";
import { getServiceDbClient } from "@/server/db/service-client";
import { organizationMembers } from "@/db/schema";
import type { ActionResult } from "@/server/actions/types";

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

export type AdminResult = ActionResult;

export const NO_PERMISSION =
  "Sem permissão para gerenciar esta organização." as const;

/**
 * Backstop anti-IDOR (G5): papel do ATOR na org, lido via service-client.
 * null = não é membro. As Server Actions já conferem antes, mas como a RLS está
 * ignorada aqui, revalidamos — um caller sem gate seria um IDOR direto.
 */
export async function actorRole(
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

export function isManager(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}
