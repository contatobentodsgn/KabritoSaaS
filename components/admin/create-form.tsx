"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { emptyFormState, type FormState } from "@/server/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultChecked?: boolean;
}

/** Formulário genérico de criação (admin), via useActionState. */
export function CreateForm({
  action,
  fields,
  submitLabel = "Criar",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: FieldDef[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          {f.type !== "checkbox" && <Label htmlFor={f.name}>{f.label}</Label>}
          {f.type === "textarea" ? (
            <Textarea
              id={f.name}
              name={f.name}
              placeholder={f.placeholder}
              required={f.required}
            />
          ) : f.type === "select" ? (
            <select
              id={f.name}
              name={f.name}
              required={f.required}
              className="flex h-10 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm transition-[border-color,box-shadow] focus-visible:border-rose-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-100"
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={f.name}
                defaultChecked={f.defaultChecked}
                className="size-4 rounded-sm border-input accent-primary"
              />
              {f.label}
            </label>
          ) : (
            <Input
              id={f.name}
              name={f.name}
              placeholder={f.placeholder}
              required={f.required}
            />
          )}
          {state.fieldErrors?.[f.name]?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors[f.name]![0]}
            </p>
          )}
        </div>
      ))}
      <SubmitButton size="sm">{submitLabel}</SubmitButton>
    </form>
  );
}
