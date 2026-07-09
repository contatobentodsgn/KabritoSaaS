"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  startEnrollAction,
  confirmEnrollAction,
  disableMfaAction,
} from "@/server/actions/mfa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Ativa/desativa a verificação em duas etapas (TOTP) do usuário. */
export function MfaSettings({
  enrolled,
  factorId,
}: {
  enrolled: boolean;
  factorId: string | null;
}) {
  const [pending, start] = useTransition();
  const [enroll, setEnroll] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);

  function begin() {
    start(async () => {
      const res = await startEnrollAction();
      if (res.ok)
        setEnroll({
          factorId: res.factorId,
          qrCode: res.qrCode,
          secret: res.secret,
        });
      else toast.error(res.error);
    });
  }

  function confirm() {
    if (!enroll) return;
    start(async () => {
      const res = await confirmEnrollAction(enroll.factorId, code.trim());
      if (res.ok) {
        toast.success("Verificação em duas etapas ativada.");
        setEnroll(null);
        setCode("");
      } else toast.error(res.error);
    });
  }

  function disable() {
    if (!factorId) return;
    setDisableOpen(false);
    start(async () => {
      const res = await disableMfaAction(factorId);
      if (res.ok) toast.success("2FA desativado.");
      else toast.error(res.error);
    });
  }

  if (enrolled) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-forest-700 dark:text-forest-200">
          ✓ Verificação em duas etapas ativa.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDisableOpen(true)}
          disabled={pending}
        >
          Desativar 2FA
        </Button>
        <ConfirmDialog
          open={disableOpen}
          title="Desativar a verificação em duas etapas?"
          description="Sua conta volta a entrar apenas com a senha."
          confirmLabel="Desativar"
          destructive
          pending={pending}
          onCancel={() => setDisableOpen(false)}
          onConfirm={disable}
        />
      </div>
    );
  }

  if (enroll) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          Escaneie o QR no seu app autenticador (Google Authenticator,
          1Password…) e digite o código de 6 dígitos.
        </p>
        <div
          className="inline-flex rounded-lg border border-border bg-white p-3"
          // QR em SVG vindo do Supabase (origem confiável, sem input de usuário).
          dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
        />
        <p className="text-xs text-muted-foreground">
          Não consegue escanear? Código manual:{" "}
          <code className="font-mono text-foreground">{enroll.secret}</code>
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            className="w-32 font-mono tracking-widest"
          />
          <Button
            size="sm"
            onClick={confirm}
            disabled={pending || code.trim().length < 6}
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEnroll(null);
              setCode("");
            }}
            disabled={pending}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Proteja a conta com um código do seu app autenticador, além da senha.
      </p>
      <Button size="sm" onClick={begin} disabled={pending}>
        Ativar 2FA
      </Button>
    </div>
  );
}
