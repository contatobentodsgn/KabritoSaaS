"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { signUpAction, resendConfirmationAction } from "@/server/actions/auth";
import { emptyFormState } from "@/server/actions/types";
import { PASSWORD_RULES_HINT } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(signUpAction, emptyFormState);
  const [resending, startResend] = useTransition();

  // Estado de SUCESSO: conta criada, falta confirmar o e-mail (sem sessão).
  if (state.ok && state.email) {
    const email = state.email;
    const resend = () => {
      startResend(async () => {
        const res = await resendConfirmationAction(email);
        if (res.error) toast.error(res.error);
        else toast.success(res.message ?? "Link reenviado.");
      });
    };
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint-100 text-forest-600 dark:bg-forest-900 dark:text-forest-300">
          <Mail className="size-6" strokeWidth={1.5} />
        </span>
        <div className="space-y-1.5">
          <h2 className="font-serif text-xl text-foreground">
            Confirme seu e-mail
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <span className="font-medium text-foreground">{email}</span>. Abra o
            e-mail para ativar sua conta e entrar.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button variant="outline" onClick={resend} disabled={resending}>
            {resending ? "Reenviando..." : "Reenviar link"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>
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
          <p className="text-sm text-destructive">
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
          className="font-medium text-foreground underline-offset-4 transition-colors duration-150 hover:text-forest-800 dark:hover:text-forest-100 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
