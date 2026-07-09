"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleDashboardCard } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

export function CardToggle({
  cardKey,
  enabled,
}: {
  cardKey: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleDashboardCard(cardKey, !enabled);
          if (r.ok) router.refresh();
          else toast.error(r.error);
        })
      }
    >
      {enabled ? "Desativar" : "Ativar"}
    </Button>
  );
}
