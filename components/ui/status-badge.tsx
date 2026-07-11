import { Badge, type BadgeProps } from "@/components/ui/badge";

export interface StatusMapEntry {
  label: string;
  variant: BadgeProps["variant"];
}

/**
 * Badge de status genérico — cada domínio (revisão, run, assinatura...)
 * mantém o próprio `map` (vocabulário e variant diferem por domínio), só o
 * "procura no map, cai pro fallback" fica compartilhado (era repetido em
 * review/page.tsx e runs/page.tsx).
 */
export function StatusBadge({
  status,
  map,
  fallbackVariant = "secondary",
}: {
  status: string;
  map: Record<string, StatusMapEntry>;
  fallbackVariant?: BadgeProps["variant"];
}) {
  const entry = map[status];
  return (
    <Badge variant={entry?.variant ?? fallbackVariant}>
      {entry?.label ?? status}
    </Badge>
  );
}
