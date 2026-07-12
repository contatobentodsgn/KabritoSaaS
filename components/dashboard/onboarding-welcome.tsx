"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, X, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissOnboardingAction } from "@/server/actions/profile";

interface Step {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

/**
 * Checklist do primeiro acesso (UX-3) — 2FA e avatar são DERIVADOS de dados
 * reais (não persistidos por conta própria); "visualizar a 1ª edição" ficou
 * fora de propósito (exigiria inventar um tracking novo só pra isso). Some
 * sozinho quando os 2 passos estão completos; "Entendi"/X dispensa manualmente
 * mesmo com passos pendentes (persistido em preferences.onboardingDismissed).
 */
export function OnboardingWelcome({
  name,
  mfaEnrolled,
  hasAvatar,
  dismissedInitially,
}: {
  name: string;
  mfaEnrolled: boolean;
  hasAvatar: boolean;
  dismissedInitially: boolean;
}) {
  const [dismissed, setDismissed] = useState(dismissedInitially);
  const [, startTransition] = useTransition();

  const steps: Step[] = [
    {
      id: "avatar",
      label: "Adicionar uma foto de perfil",
      done: hasAvatar,
      href: "/settings#perfil",
      cta: "Adicionar foto",
    },
    {
      id: "mfa",
      label: "Ativar verificação em duas etapas",
      done: mfaEnrolled,
      href: "/settings#seguranca",
      cta: "Ativar 2FA",
    },
  ];
  const allDone = steps.every((s) => s.done);

  if (dismissed || allDone) return null;

  const dismiss = () => {
    setDismissed(true);
    startTransition(() => {
      void dismissOnboardingAction();
    });
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-mint-200 bg-mint-50/70 p-lg dark:border-forest-800 dark:bg-forest-950/40 sm:p-xl">
      <button
        onClick={dismiss}
        aria-label="Fechar boas-vindas"
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground k-transition hover:bg-mint-100 hover:text-foreground dark:hover:bg-forest-900 k-focus"
      >
        <X className="size-4" />
      </button>

      <span className="k-eyebrow inline-flex items-center gap-1.5">
        <Sparkles className="size-3.5" /> Bem-vindo
      </span>
      <h2 className="mt-2 max-w-xl font-serif text-2xl font-medium leading-tight text-foreground">
        Olá, {name} — vamos deixar sua conta pronta
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Toda manhã sua edição chega{" "}
        <strong className="font-medium text-foreground">
          revisada por humanos
        </strong>{" "}
        — você só adapta ao seu nicho e publica. Nada vai ao ar no automático.
      </p>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            {s.done ? (
              <CheckCircle2
                className="size-5 shrink-0 text-forest-600 dark:text-forest-300"
                aria-hidden
              />
            ) : (
              <Circle
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            )}
            <span
              className={
                s.done
                  ? "text-sm text-muted-foreground line-through"
                  : "text-sm text-foreground"
              }
            >
              {s.label}
            </span>
            {!s.done && (
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link href={s.href}>{s.cta}</Link>
              </Button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Agora não
        </Button>
      </div>
    </section>
  );
}
