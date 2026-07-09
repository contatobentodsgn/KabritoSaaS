"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Excluir conta
      </Button>
    );
  }

  return (
    <form action={deleteAccountAction} className="space-y-2">
      <p className="text-sm text-destructive">
        Isto anonimiza/apaga seus dados pessoais e encerra suas sessões. Ação
        irreversível.
      </p>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" type="submit">
          Confirmar exclusão
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
