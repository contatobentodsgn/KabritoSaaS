"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  verifyLoginMfaAction,
  verifyRecoveryCodeAction,
} from "@/server/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Formulário de verificação no login (eleva a sessão a aal2). Normalmente um
 * código TOTP de 6 dígitos; "Perdi o acesso" troca para um recovery code
 * (SEC-3) — uso único, desativa o 2FA da conta (o usuário reativa depois).
 */
export function MfaVerifyForm({ factorId }: { factorId: string }) {
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = useRecovery
        ? await verifyRecoveryCodeAction(code.trim())
        : await verifyLoginMfaAction(factorId, code.trim());
      // Sucesso → a action redireciona; só tratamos o erro aqui.
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4">
        {useRecovery ? (
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            placeholder="XXXX-XXXX-XXXX"
            className="text-center font-mono text-lg tracking-widest"
            aria-label="Código de recuperação"
          />
        ) : (
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
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={pending || code.trim().length < 6}
        >
          {pending ? "Verificando..." : "Verificar"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => {
          setUseRecovery((v) => !v);
          setCode("");
        }}
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {useRecovery
          ? "Tenho o app autenticador, usar o código de 6 dígitos"
          : "Perdi o acesso ao autenticador, usar um código de recuperação"}
      </button>
      {useRecovery && (
        <p className="text-sm text-muted-foreground">
          Também não tem mais o código de recuperação?{" "}
          <a
            href="mailto:contato@kabritodigital.com"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Fale com o suporte
          </a>
          .
        </p>
      )}
    </div>
  );
}
