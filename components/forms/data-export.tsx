"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { exportMyDataAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";

/** Baixa os dados pessoais do usuário em JSON (LGPD — portabilidade). */
export function DataExport() {
  const [pending, start] = useTransition();

  function onExport() {
    start(async () => {
      const res = await exportMyDataAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kabrito-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download iniciado.");
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onExport} disabled={pending}>
      {pending ? "Gerando…" : "Baixar meus dados (JSON)"}
    </Button>
  );
}
