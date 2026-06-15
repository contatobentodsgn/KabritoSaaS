"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { PASSWORD_RULES_HINT } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(signUpAction, emptyFormState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HINT}</p>
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
          className="rounded-sm border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-700"
        >
          {state.message}
        </p>
      )}
      <SubmitButton className="w-full" pendingText="Criando conta...">
        Criar conta
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        Ao criar conta, você concorda com os{" "}
        <Link
          href="/termos"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Termos de uso
        </Link>{" "}
        e a{" "}
        <Link
          href="/privacy"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Política de privacidade
        </Link>
        .
      </p>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 transition-colors duration-150 hover:text-forest-800 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
