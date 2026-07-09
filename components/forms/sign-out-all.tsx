"use client";

import { useState, useTransition } from "react";
import { signOutAllDevicesAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Botão "sair de todos os dispositivos" com confirmação on-brand. */
export function SignOutAll() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Sair de todos os dispositivos
      </Button>
      <ConfirmDialog
        open={open}
        title="Sair de todos os dispositivos?"
        description="Você será desconectado em todos os aparelhos (incluindo este) e precisará entrar de novo. Use isto se perdeu um aparelho ou suspeita de acesso indevido."
        confirmLabel="Sair de todos"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          start(() => signOutAllDevicesAction());
        }}
      />
    </>
  );
}
