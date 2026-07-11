import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden px-6 sm:px-8">
      <div
        aria-hidden
        data-parallax
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-mint-100/70 via-background to-background dark:from-forest-900/30"
      />

      <div
        data-hero
        className="mx-auto w-full max-w-3xl py-20 text-center sm:py-28"
      >
        <span className="k-eyebrow">Inteligência criativa diária</span>

        <h1 className="mt-5 font-serif font-medium leading-[1.04] tracking-[-0.02em] text-foreground [font-size:clamp(2.75rem,8vw,6rem)]">
          Conteúdo que cuida,{" "}
          <em className="k-serif-italic text-rose-600 dark:text-rose-500">
            com respiro
          </em>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.6] text-muted-foreground">
          Pautas quentes, análises de copy e visual, headlines e prompts prontos
          — gerados por IA e revisados por humanos antes de publicar.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="pill">
            <Link href="/register">Criar conta grátis</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="pill"
            className="border-forest-600 text-forest-700 hover:bg-forest-50 hover:text-forest-800 dark:border-forest-400 dark:text-forest-200 dark:hover:bg-forest-900 dark:hover:text-forest-100"
          >
            <Link href="/login">Entrar</Link>
          </Button>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          Teste grátis por 14 dias · sem cartão de crédito
        </p>
      </div>
    </section>
  );
}
