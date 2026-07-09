"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { verifyLoginMfaAction } from "@/server/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Formulário de verificação TOTP no login (eleva a sessão a aal2). */
export function MfaVerifyForm({ factorId }: { factorId: string }) {
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await verifyLoginMfaAction(factorId, code.trim());
      // Sucesso → a action redireciona; só tratamos o erro aqui.
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={6}
        // Única interação da tela dedicada de verificação TOTP (padrão de UX de campo OTP); tem aria-label.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="text-center font-mono text-lg tracking-[0.4em]"
        aria-label="Código de verificação"
      />
      <Button
        type="submit"
        className="w-full"
        disabled={pending || code.trim().length < 6}
      >
        {pending ? "Verificando..." : "Verificar"}
      </Button>
    </form>
  );
}
