"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ACK_KEY = "kabrito-cookie-ack";

/**
 * Aviso de cookies (LGPD/transparência). O Kabrito usa só cookies ESSENCIAIS
 * (sessão de login, dispositivo, preferência de tema) — sem rastreamento de
 * anúncios — então é um aviso dispensável, não um muro de consentimento.
 * Mostra uma vez (flag em localStorage); dep-free, com guarda de mounted pra
 * não causar mismatch de hidratação.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ACK_KEY)) setShow(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-4">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-k-1 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Usamos apenas cookies essenciais (login e preferências) — sem
          rastreamento de anúncios.{" "}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-2 transition-colors hover:text-forest-700 dark:hover:text-forest-200"
          >
            Saiba mais
          </Link>
          .
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0">
          Entendi
        </Button>
      </div>
    </div>
  );
}
