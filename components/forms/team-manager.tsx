"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TeamMember, MemberRole, PendingInvite } from "@/server/admin/team";
import {
  addMemberAction,
  setMemberRoleAction,
  removeMemberAction,
  cancelInviteAction,
} from "@/server/actions/team";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Dono",
  admin: "Administrador",
  member: "Membro",
};

const ROLE_BADGE: Record<MemberRole, "forest" | "secondary" | "outline"> = {
  owner: "forest",
  admin: "secondary",
  member: "outline",
};

const selectCls =
  "flex h-9 rounded-sm border border-input bg-card px-2 text-sm transition-[border-color,box-shadow] focus-visible:border-rose-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-100 disabled:opacity-50";

export function TeamManager({
  members,
  pendingInvites,
  canManage,
}: {
  members: TeamMember[];
  pendingInvites: PendingInvite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  function onInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      const res = await addMemberAction({ email, role: inviteRole });
      if (res.ok) {
        toast.success(
          res.status === "added"
            ? "Adicionado à equipe."
            : "Convite enviado por e-mail. A pessoa entra ao criar a conta.",
        );
        setEmail("");
        setInviteRole("member");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onCancelInvite(inviteId: string) {
    start(async () => {
      const res = await cancelInviteAction({ inviteId });
      if (res.ok) {
        toast.success("Convite cancelado.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onChangeRole(userId: string, role: MemberRole) {
    start(async () => {
      const res = await setMemberRoleAction({ userId, role });
      if (res.ok) {
        toast.success("Papel atualizado.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onRemove(member: TeamMember) {
    const label = member.name ?? member.email;
    if (!window.confirm(`Remover ${label} do workspace?`)) return;
    start(async () => {
      const res = await removeMemberAction({ userId: member.userId });
      if (res.ok) {
        toast.success("Membro removido.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {members.map((m) => {
              const isOwner = m.role === "owner";
              return (
                <li
                  key={m.userId}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.name ?? "—"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && !isOwner ? (
                      <>
                        <Label htmlFor={`role-${m.userId}`} className="sr-only">
                          Papel
                        </Label>
                        <select
                          id={`role-${m.userId}`}
                          className={selectCls}
                          value={m.role}
                          disabled={pending}
                          onChange={(e) =>
                            onChangeRole(m.userId, e.target.value as MemberRole)
                          }
                        >
                          <option value="admin">Administrador</option>
                          <option value="member">Membro</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={pending}
                          aria-label={`Remover ${m.email}`}
                          onClick={() => onRemove(m)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant={ROLE_BADGE[m.role]}>
                        {ROLE_LABEL[m.role]}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {canManage && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Convidado como {inv.role === "admin" ? "Administrador" : "Membro"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pendente</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={pending}
                      aria-label={`Cancelar convite de ${inv.email}`}
                      onClick={() => onCancelInvite(inv.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convidar por e-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onInvite}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="pessoa@agencia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Papel</Label>
                <select
                  id="invite-role"
                  className={`${selectCls} h-10 w-full px-3`}
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "admin" | "member")
                  }
                >
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Convidar
              </Button>
            </form>
            <p className="pt-3 text-xs text-muted-foreground">
              Se a pessoa já tem conta, entra na hora. Se não, enviamos um
              convite por e-mail e ela entra ao criar a conta com esse e-mail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
