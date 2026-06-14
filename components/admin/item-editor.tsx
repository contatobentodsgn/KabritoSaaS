"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateItemField, deleteItem } from "@/server/actions/admin";
import type { EditableTable } from "@/lib/validations/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, f.value])),
  );

  function save(field: string) {
    start(async () => {
      const res = await updateItemField({ table, id, field, value: values[field] ?? "" });
      if (res.ok) {
        toast.success("Item atualizado.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove() {
    if (!confirm("Remover este item da edição?")) return;
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
        <p className="font-serif text-base font-medium leading-tight">{title}</p>
        <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Remover item">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <Label className="k-eyebrow">{f.label}</Label>
            <Textarea
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              rows={f.value.length > 120 ? 4 : 2}
            />
            <Button variant="outline" size="sm" onClick={() => save(f.name)} disabled={pending}>
              Salvar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
