"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/server/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { FavoriteEntityType } from "@/lib/constants";

export function FavoriteButton({
  entityType,
  entityId,
  initial = false,
}: {
  entityType: FavoriteEntityType;
  entityId: string;
  initial?: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await toggleFavorite({ entityType, entityId });
      if (res.ok) {
        setFav(res.favorited);
        toast.success(
          res.favorited ? "Salvo nos favoritos" : "Removido dos favoritos",
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={pending}
      aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
      title={fav ? "Remover dos favoritos" : "Favoritar"}
    >
      <Heart className={cn("size-4", fav && "fill-rose-500 text-rose-500")} />
    </Button>
  );
}
