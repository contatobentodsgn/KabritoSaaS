"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDED_KEY = "kabrito-onboarded";

/**
 * Boas-vindas do primeiro acesso. O assinante recém-pago cai num dashboard que
 * pode parecer "à espera" — aqui explicamos o ritmo (automation-first, revisão
 * humana) e damos 2 atalhos calmos. Dispensável (flag em localStorage), dep-free.
 */
export function OnboardingWelcome({ name }: { name: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) setShow(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  if (!show) return null;

  const done = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-mint-200 bg-mint-50/70 p-6 dark:border-forest-800 dark:bg-forest-950/40 sm:p-8">
      <button
        onClick={done}
        aria-label="Fechar boas-vindas"
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-mint-100 hover:text-foreground dark:hover:bg-forest-900"
      >
        <X className="size-4" />
      </button>

      <span className="k-eyebrow inline-flex items-center gap-1.5">
        <Sparkles className="size-3.5" /> Bem-vindo
      </span>
      <h2 className="mt-2 max-w-xl font-serif text-2xl font-medium leading-tight text-foreground">
        Olá, {name} — é assim que o Kabrito trabalha por você
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Toda manhã sua edição chega{" "}
        <strong className="font-medium text-foreground">
          revisada por humanos
        </strong>{" "}
        — você só adapta ao seu nicho e publica. Nada vai ao ar no automático.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/prompts">Conhecer os prompts</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/adaptar">Adaptar ao meu nicho</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={done}>
          Entendi
        </Button>
      </div>
    </section>
  );
}
