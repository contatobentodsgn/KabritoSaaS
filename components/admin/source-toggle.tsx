"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleSourceActive } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

export function SourceToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleSourceActive(id, !active);
          if (r.ok) router.refresh();
          else toast.error(r.error);
        })
      }
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
