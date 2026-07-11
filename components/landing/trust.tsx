import { ShieldCheck, Radar, Lock, BadgeCheck } from "lucide-react";

/** Por que confiar — garantias reais do produto (no lugar de depoimentos forjados). */
const TRUST = [
  {
    icon: ShieldCheck,
    title: "Revisão humana",
    desc: "Nada vai ao ar sem aprovação. A IA propõe, você decide.",
  },
  {
    icon: Radar,
    title: "Sem scraping",
    desc: "Só fontes públicas e legais. Nada de raspar redes sociais.",
  },
  {
    icon: Lock,
    title: "Seus dados protegidos",
    desc: "Isolamento por usuário no banco e conformidade com a LGPD.",
  },
  {
    icon: BadgeCheck,
    title: "Plano único, sem pegadinha",
    desc: "Sem níveis confusos. Cancele quando quiser.",
  },
] as const;

export function Trust() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
      <div data-reveal className="max-w-2xl">
        <span className="k-eyebrow">Confiança</span>
        <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Feito com responsabilidade.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Sem atalhos que colocam sua marca em risco. Cada escolha protege quem
          usa e quem é divulgado.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {TRUST.map((t) => (
          <div key={t.title} data-reveal className="flex gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700 dark:bg-forest-900 dark:text-forest-200">
              <t.icon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-medium text-foreground">{t.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
