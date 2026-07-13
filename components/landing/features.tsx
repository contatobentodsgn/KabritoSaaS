import {
  Flame,
  PenLine,
  Image as ImageIcon,
  Type,
  Sparkles,
  Wand2,
  CalendarRange,
  Radar,
} from "lucide-react";

/** O que entrega — espelha os módulos do app. */
const FEATURES = [
  {
    icon: Flame,
    title: "Pautas quentes",
    desc: "Temas em alta com leitura de saturação e risco.",
  },
  {
    icon: PenLine,
    title: "Análise de copy",
    desc: "Padrões de copy que estão funcionando agora, explicados.",
  },
  {
    icon: ImageIcon,
    title: "Padrões visuais",
    desc: "Referências de imagem e direção de arte.",
  },
  {
    icon: Type,
    title: "Headlines",
    desc: "Títulos prontos para testar, em variações.",
  },
  {
    icon: Sparkles,
    title: "Prompts prontos",
    desc: "Prompts de IA para gerar texto e imagem na hora.",
  },
  {
    icon: Wand2,
    title: "Adaptado ao seu nicho",
    desc: "Tudo filtrado para o seu público e tom.",
  },
  {
    icon: CalendarRange,
    title: "Calendário editorial",
    desc: "Datas e ganchos para planejar a semana.",
  },
  {
    icon: Radar,
    title: "Radar de descoberta",
    desc: "Sinais novos antes de virarem óbvios.",
  },
] as const;

export function Features() {
  return (
    <section className="border-y border-border bg-mint-50/50 dark:bg-forest-950/30">
      <div className="mx-auto w-full max-w-landing px-6 py-20 sm:px-8 sm:py-28">
        <div data-reveal className="max-w-2xl">
          <span className="k-eyebrow">A entrega</span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Você nunca começa do zero.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Uma edição completa, do gancho ao prompt — só revisar, adaptar e
            publicar.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-reveal
              className="rounded-xl border border-border bg-card p-5"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-forest-50 text-forest-700 dark:bg-forest-900 dark:text-forest-200">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-medium text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
