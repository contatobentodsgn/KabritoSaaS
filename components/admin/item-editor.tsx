"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateItemField, deleteItem } from "@/server/actions/admin";
import type { EditableTable } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface EditableField {
  name: string;
  label: string;
  value: string;
}

/** Edição in-place dos campos de texto de um item + remoção (rejeição do item). */
export function ItemEditor({
  table,
  id,
  fields,
  title,
}: {
  table: EditableTable;
  id: string;
  fields: EditableField[];
  title: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const initial = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, f.value])),
    [fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Só os campos realmente alterados são salvos — um único "Salvar alterações".
  const dirty = fields.filter(
    (f) => (values[f.name] ?? "") !== initial[f.name],
  );

  function saveAll() {
    if (dirty.length === 0) return;
    start(async () => {
      for (const f of dirty) {
        const res = await updateItemField({
          table,
          id,
          field: f.name,
          value: values[f.name] ?? "",
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      toast.success(
        dirty.length === 1 ? "Campo salvo." : `${dirty.length} campos salvos.`,
      );
      router.refresh();
    });
  }

  function doRemove() {
    setConfirmRemove(false);
    start(async () => {
      const res = await deleteItem({ table, id });
      if (res.ok) {
        toast.success("Item removido.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-serif text-base font-medium leading-tight">
          {title}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmRemove(true)}
          disabled={pending}
          aria-label="Remover item"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <Label className="k-eyebrow">{f.label}</Label>
            <Textarea
              value={values[f.name] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.name]: e.target.value }))
              }
              rows={f.value.length > 120 ? 4 : 2}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={saveAll}
          disabled={pending || dirty.length === 0}
        >
          Salvar alterações
        </Button>
        {dirty.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {dirty.length}{" "}
            {dirty.length === 1
              ? "alteração não salva"
              : "alterações não salvas"}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remover este item?"
        description="O item sai da edição. Isso não pode ser desfeito."
        confirmLabel="Remover"
        destructive
        pending={pending}
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
