"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { PASSWORD_RULES_HINT } from "@/lib/validations/auth";
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
        {state.fieldErrors?.password ? (
          <p role="alert" className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HINT}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        {state.fieldErrors?.confirmPassword && (
          <p role="alert" className="text-sm text-destructive">
            {state.fieldErrors.confirmPassword[0]}
          </p>
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
