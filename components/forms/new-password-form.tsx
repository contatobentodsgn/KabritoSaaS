"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, emptyFormState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        {state.fieldErrors?.password && (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingText="Salvando...">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
