import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
      <div
        data-reveal
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest-700 to-forest-800 px-6 py-12 text-center sm:px-8 sm:py-16"
      >
        <h2 className="font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Comece hoje, com calma.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-mint-100">
          Crie sua conta grátis e veja a primeira edição pronta para revisar.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="pill"
            className="bg-white text-forest-800 hover:bg-mint-50"
          >
            <Link href="/register">Criar conta grátis</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="pill"
            className="text-mint-100 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-mint-200">
          Teste grátis por 14 dias · sem cartão de crédito
        </p>
      </div>
    </section>
  );
}
