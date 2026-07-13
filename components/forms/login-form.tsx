"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(signInAction, emptyFormState);

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
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password && (
          <p role="alert" className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
        <div className="text-right">
          <Link
            href="/recuperar-senha"
            className="text-sm text-muted-foreground underline-offset-4 k-transition hover:text-foreground hover:underline k-focus"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingText="Entrando...">
        Entrar
      </SubmitButton>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 k-transition hover:text-forest-800 dark:hover:text-forest-200 hover:underline k-focus"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
