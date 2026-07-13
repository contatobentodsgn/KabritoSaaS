"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function ResetRequestForm() {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    emptyFormState,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state.fieldErrors?.email && (
          <p role="alert" className="text-sm text-destructive">
            {state.fieldErrors.email[0]}
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
      {state.message && (
        <p
          role="status"
          className="rounded-sm border border-forest-200 dark:border-forest-700 bg-forest-50 dark:bg-forest-900 px-3 py-2 text-sm text-forest-700 dark:text-forest-200"
        >
          {state.message}
        </p>
      )}
      <SubmitButton className="w-full" pendingText="Enviando...">
        Enviar link de redefinição
      </SubmitButton>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 k-transition hover:text-forest-800 dark:hover:text-forest-100 hover:underline k-focus"
        >
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
