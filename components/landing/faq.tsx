import { ChevronDown } from "lucide-react";

// Exportado pro JSON-LD (FAQPage) em app/page.tsx derivar das MESMAS
// perguntas/respostas exibidas aqui — sem duplicar o conteúdo.
export const FAQS = [
  {
    q: "Preciso de cartão para começar?",
    a: "Não. Você cria a conta e tem 14 dias grátis, sem cartão de crédito — depois, é só assinar o plano único.",
  },
  {
    q: "A IA publica sozinha?",
    a: "Nunca. Tudo é revisado por uma pessoa antes de ir ao ar — essa é a regra central do Kabrito.",
  },
  {
    q: "Vocês raspam as redes sociais?",
    a: "Não. Usamos apenas fontes públicas e legais, como Google News e feeds RSS.",
  },
  {
    q: "Para quais plataformas funciona?",
    a: "Instagram, LinkedIn, Threads e TikTok — com adaptação ao seu nicho.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, a qualquer momento. Plano único, sem fidelidade nem pegadinha.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Cada conta é isolada no banco de dados e tratamos tudo em conformidade com a LGPD.",
  },
] as const;

export function Faq() {
  return (
    <section className="border-t border-border bg-mint-50/50 dark:bg-forest-950/30">
      <div className="mx-auto w-full max-w-[760px] px-6 py-20 sm:px-8 sm:py-28">
        <div data-reveal className="text-center">
          <span className="k-eyebrow">Dúvidas</span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Perguntas frequentes.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              data-reveal
              className="group rounded-xl border border-border bg-card p-5 [&_summary]:list-none"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-foreground">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
