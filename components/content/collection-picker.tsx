"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderInput } from "lucide-react";
import { toast } from "sonner";
import { setFavoriteCollection } from "@/server/actions/favorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FavoriteEntityType } from "@/lib/constants";

/**
 * Move um item favoritado para uma coleção. Campo livre com datalist das
 * coleções existentes (criar/escolher) — vazio volta o item para "Geral".
 */
export function CollectionPicker({
  entityType,
  entityId,
  current,
  collections = [],
}: {
  entityType: FavoriteEntityType;
  entityId: string;
  current?: string | null;
  collections?: string[];
}) {
  const [value, setValue] = useState(current ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();
  const listId = useId();
  const inputId = useId();

  function onSave() {
    const next = value.trim();
    start(async () => {
      const res = await setFavoriteCollection({
        entityType,
        entityId,
        collection: next,
      });
      if (res.ok) {
        toast.success(next ? `Movido para "${next}"` : "Movido para Geral");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const dirty = value.trim() !== (current ?? "").trim();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={inputId} className="flex items-center gap-1.5 text-muted-foreground">
          <FolderInput className="size-3.5" />
          Coleção
        </Label>
        <Input
          id={inputId}
          list={listId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={60}
          placeholder="Geral"
          disabled={pending}
          aria-label="Nome da coleção"
        />
        {collections.length > 0 && (
          <datalist id={listId}>
            {collections.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
      </div>
      <Button
        variant="blush"
        size="sm"
        onClick={onSave}
        disabled={pending || !dirty}
      >
        Salvar
      </Button>
    </div>
  );
}
