"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronUp, ChevronDown } from "lucide-react";
import { moveDashboardCard } from "@/server/actions/admin";
import { cn } from "@/lib/utils/cn";

const btn =
  "flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";

export function CardMove({
  cardKey,
  isFirst,
  isLast,
}: {
  cardKey: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const move = (direction: "up" | "down") =>
    start(async () => {
      const r = await moveDashboardCard(cardKey, direction);
      if (r.ok) router.refresh();
      else toast.error(r.error);
    });

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Mover para cima"
        disabled={pending || isFirst}
        onClick={() => move("up")}
        className={cn(btn)}
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Mover para baixo"
        disabled={pending || isLast}
        onClick={() => move("down")}
        className={cn(btn)}
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
