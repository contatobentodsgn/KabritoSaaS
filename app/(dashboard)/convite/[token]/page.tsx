import Link from "next/link";
import { getInviteByToken, type MemberRole } from "@/server/admin/team";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcceptInvite } from "@/components/forms/accept-invite";

export const metadata = { title: "Convite · Inteligência Criativa" };

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Dono",
  admin: "Administrador",
  member: "Membro",
};

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  return (
    <>
      <PageHeader eyebrow="Convite" title="Convite para a equipe" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{invite ? invite.orgName : "Convite"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invite ? (
            <p className="text-sm text-muted-foreground">
              Convite inválido ou expirado. Peça um novo link a quem te
              convidou.
            </p>
          ) : invite.acceptedAt ? (
            <>
              <p className="text-sm text-muted-foreground">
                Este convite já foi aceito.
              </p>
              <Button asChild>
                <Link href="/dashboard">Ir para o app</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você foi convidado para <strong>{invite.orgName}</strong> como{" "}
                {ROLE_LABEL[invite.role]}.
              </p>
              <AcceptInvite token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
