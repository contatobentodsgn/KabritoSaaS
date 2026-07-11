import { Radar, Sparkles, ShieldCheck } from "lucide-react";

/** Como funciona — 3 passos do fluxo real (automação-first, revisão humana). */
const STEPS = [
  {
    icon: Radar,
    title: "Captamos os sinais",
    desc: "Acompanhamos o que está em alta em fontes públicas e legais — Google News, feeds RSS. Sem scraping de redes.",
  },
  {
    icon: Sparkles,
    title: "A IA escreve os rascunhos",
    desc: "Pautas, análises de copy e visual, headlines e prompts — gerados e adaptados ao seu nicho.",
  },
  {
    icon: ShieldCheck,
    title: "Pessoas aprovam",
    desc: "Nada é publicado no automático. Você revisa e só o que passa no crivo vai ao ar.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
      <div data-reveal className="max-w-2xl">
        <span className="k-eyebrow">Como funciona</span>
        <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Inteligência com cuidado, todo dia.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          A automação faz o trabalho pesado; a decisão final é sempre de uma
          pessoa. Em três passos, do sinal à edição pronta.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            data-reveal
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <span className="font-serif text-sm font-medium text-muted-foreground">
              0{i + 1}
            </span>
            <span className="mt-4 inline-flex size-11 items-center justify-center rounded-full bg-forest-50 text-forest-700 dark:bg-forest-900 dark:text-forest-200">
              <step.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
