"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateItemField, deleteItem } from "@/server/actions/admin/review";
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
  // Última versão CONFIRMADA pelo servidor de cada campo — separado de
  // `initial` pra sobreviver a um salvamento parcial (alguns campos salvam,
  // outros falham): só os que falharam continuam "sujos" depois.
  const [savedValues, setSavedValues] =
    useState<Record<string, string>>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Só os campos realmente alterados são salvos — um único "Salvar alterações".
  const dirty = fields.filter(
    (f) => (values[f.name] ?? "") !== savedValues[f.name],
  );

  function saveAll() {
    const toSave = dirty;
    if (toSave.length === 0) return;
    start(async () => {
      // Campos independentes (colunas distintas) — salvam em paralelo, e cada
      // um reporta o próprio resultado (UX-6): uma falha não trava os demais
      // nem os deixa marcados como "salvos" incorretamente.
      const results = await Promise.all(
        toSave.map(async (f) => {
          const value = values[f.name] ?? "";
          const res = await updateItemField({
            table,
            id,
            field: f.name,
            value,
          });
          return {
            name: f.name,
            value,
            ok: res.ok,
            error: res.ok ? undefined : res.error,
          };
        }),
      );
      const okOnes = results.filter((r) => r.ok);
      const failedOnes = results.filter((r) => !r.ok);

      if (okOnes.length > 0) {
        setSavedValues((sv) => {
          const next = { ...sv };
          for (const r of okOnes) next[r.name] = r.value;
          return next;
        });
      }
      setFieldErrors((fe) => {
        const next = { ...fe };
        for (const r of okOnes) delete next[r.name];
        for (const r of failedOnes)
          next[r.name] = r.error ?? "Falha ao salvar.";
        return next;
      });

      if (failedOnes.length === 0) {
        toast.success(
          okOnes.length === 1
            ? "Campo salvo."
            : `${okOnes.length} campos salvos.`,
        );
      } else if (okOnes.length === 0) {
        toast.error(
          failedOnes.length === 1
            ? (failedOnes[0]?.error ?? "Falha ao salvar.")
            : `Falha ao salvar ${failedOnes.length} campos.`,
        );
      } else {
        toast.warning(
          `${okOnes.length} de ${results.length} campos salvos — confira os campos destacados.`,
        );
      }
      if (okOnes.length > 0) router.refresh();
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
        {fields.map((f) => {
          const fieldError = fieldErrors[f.name];
          return (
            <div key={f.name} className="space-y-1">
              <Label className="k-eyebrow">{f.label}</Label>
              <Textarea
                value={values[f.name] ?? ""}
                onChange={(e) => {
                  const next = e.target.value;
                  setValues((v) => ({ ...v, [f.name]: next }));
                  if (fieldError) {
                    setFieldErrors((fe) => {
                      const rest = { ...fe };
                      delete rest[f.name];
                      return rest;
                    });
                  }
                }}
                aria-invalid={!!fieldError}
                className={fieldError ? "border-destructive" : undefined}
                rows={f.value.length > 120 ? 4 : 2}
              />
              {fieldError && (
                <p className="text-xs text-destructive">{fieldError}</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          onClick={saveAll}
          disabled={pending || dirty.length === 0}
        >
          {pending ? "Salvando..." : "Salvar alterações"}
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
