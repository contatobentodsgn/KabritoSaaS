import { cn } from "@/lib/utils/cn";

/** Bloco de placeholder para loading.tsx — mesmo tom (`bg-foreground/10`) usado no skeleton do dashboard. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
    />
  );
}
