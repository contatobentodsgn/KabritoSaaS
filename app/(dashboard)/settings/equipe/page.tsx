import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getCurrentOrganization,
  getCurrentOrgRole,
} from "@/server/auth/session";
import { listMembers, listPendingInvites } from "@/server/admin/team";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/content/empty-state";
import { TeamManager } from "@/components/forms/team-manager";

export const metadata = { title: "Equipe · Inteligência Criativa" };

export default async function EquipePage() {
  const user = await getCurrentUser();
  const org = await getCurrentOrganization();
  if (!user || !org) redirect("/settings");

  const role = await getCurrentOrgRole();
  const canManage = role === "owner" || role === "admin";

  const [members, pendingInvites] = await Promise.all([
    listMembers(org.id, user.id),
    canManage ? listPendingInvites(org.id, user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Equipe"
        description={`Membros e papéis de ${org.name}.`}
      />

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              title="Nenhum membro ainda"
              description={
                canManage
                  ? "Convide pessoas por e-mail para colaborar neste workspace."
                  : "Peça a um administrador para convidar pessoas a este workspace."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <TeamManager
          members={members}
          pendingInvites={pendingInvites}
          canManage={canManage}
        />
      )}
    </>
  );
}
