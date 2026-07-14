"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Demo interativa do ConfirmDialog (precisa de estado, por isso é client). */
export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Abrir confirm dialog
      </Button>
      <ConfirmDialog
        open={open}
        title="Confirmar ação de exemplo"
        description="Isso é só uma demonstração do ConfirmDialog — nada é executado de verdade."
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
