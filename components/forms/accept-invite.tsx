"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { acceptInviteAction } from "@/server/actions/team";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onAccept() {
    start(async () => {
      const res = await acceptInviteAction(token);
      if (res.ok) {
        toast.success(`Você entrou em ${res.orgName}.`);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button onClick={onAccept} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
      {pending ? "Aceitando..." : "Aceitar convite"}
    </Button>
  );
}
