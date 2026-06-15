import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Landing page pública — hero editorial Kabrito. */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Topo: logo Kabrito */}
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" aria-label="Kabrito · página inicial">
          <img
            src="/brand/logo-kabrito.svg"
            alt="Kabrito"
            className="h-7 w-auto"
          />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Entrar</Link>
        </Button>
      </header>

      {/* Hero editorial — único momento com gradiente suave Mint */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 sm:px-8">
        {/* Respiro de cor: gradiente Mint discreto ao fundo, sem exagero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-mint-100/70 via-background to-background"
        />

        <div className="mx-auto w-full max-w-3xl py-20 text-center sm:py-28">
          <span className="k-eyebrow">Inteligência criativa diária</span>

          <h1 className="mt-5 font-serif font-medium leading-[1.04] tracking-[-0.02em] text-foreground [font-size:clamp(2.75rem,8vw,6rem)]">
            Conteúdo que cuida,{" "}
            <em className="k-serif-italic text-rose-500">com respiro</em>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.6] text-muted-foreground">
            Pautas quentes, análises de copy e visual, headlines e prompts
            prontos — gerados por IA e revisados por humanos antes de publicar.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="pill">
              <Link href="/register">Criar conta grátis</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="pill"
              className="border-forest-600 text-forest-700 hover:bg-forest-50 hover:text-forest-800"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Grátis para começar · sem cartão de crédito
          </p>
        </div>
      </main>

      {/* Rodapé calmo */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <span>© 2026 Kabrito · feito com cuidado no Brasil</span>
          <div className="flex items-center gap-4">
            <Link
              href="/termos"
              className="transition-colors duration-150 hover:text-foreground"
            >
              Termos
            </Link>
            <Link
              href="/privacy"
              className="transition-colors duration-150 hover:text-foreground"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
