import Link from "next/link";
import {
  Radar,
  Sparkles,
  ShieldCheck,
  Flame,
  PenLine,
  Image as ImageIcon,
  Type,
  Wand2,
  CalendarRange,
  Lock,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingReveal } from "@/components/landing/landing-reveal";

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

/** O que entrega — espelha os módulos do app. */
const FEATURES = [
  { icon: Flame, title: "Pautas quentes", desc: "Temas em alta com leitura de saturação e risco." },
  { icon: PenLine, title: "Análise de copy", desc: "Padrões de texto que convertem, explicados." },
  { icon: ImageIcon, title: "Padrões visuais", desc: "Referências de imagem e direção de arte." },
  { icon: Type, title: "Headlines", desc: "Títulos prontos para testar, em variações." },
  { icon: Sparkles, title: "Prompts prontos", desc: "Prompts de IA para gerar texto e imagem na hora." },
  { icon: Wand2, title: "Adaptado ao seu nicho", desc: "Tudo filtrado para o seu público e tom." },
  { icon: CalendarRange, title: "Calendário editorial", desc: "Datas e ganchos para planejar a semana." },
  { icon: Radar, title: "Radar de descoberta", desc: "Sinais novos antes de virarem óbvios." },
] as const;

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

const FAQS = [
  {
    q: "Preciso de cartão para começar?",
    a: "Não. Você cria a conta grátis e começa na hora, sem cartão de crédito.",
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

/** Landing page pública — hero editorial + seções de conversão (GSAP no scroll). */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Habilita a pré-ocultação só quando há JS (.js-reveal), e arma um failsafe:
          se o GSAP não inicializar (chunk falhou/erro), reexibe tudo após 4s.
          Sem JS, nada disso roda → conteúdo sempre visível. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var h=document.documentElement;h.classList.add('js-reveal');window.setTimeout(function(){if(!window.__kReveal)h.classList.remove('js-reveal');},4000);})();",
        }}
      />

      {/* Topo fixo — CTA sempre ao alcance */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Kabrito · página inicial"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <img src="/brand/logo-kabrito.svg" alt="Kabrito" className="h-7 w-auto dark:hidden" />
            <img
              src="/brand/logo-kabrito-inverse.svg"
              alt="Kabrito"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-forest-600 text-forest-700 hover:bg-forest-50 hover:text-forest-800 dark:border-forest-400 dark:text-forest-200 dark:hover:bg-forest-900 dark:hover:text-forest-100"
            >
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — único momento com gradiente suave Mint */}
        <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden px-6 sm:px-8">
          <div
            aria-hidden
            data-parallax
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-mint-100/70 via-background to-background dark:from-forest-900/30"
          />

          <div data-hero className="mx-auto w-full max-w-3xl py-20 text-center sm:py-28">
            <span className="k-eyebrow">Inteligência criativa diária</span>

            <h1 className="mt-5 font-serif font-medium leading-[1.04] tracking-[-0.02em] text-foreground [font-size:clamp(2.75rem,8vw,6rem)]">
              Conteúdo que cuida,{" "}
              <em className="k-serif-italic text-rose-600 dark:text-rose-500">
                com respiro
              </em>
              .
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
                className="border-forest-600 text-forest-700 hover:bg-forest-50 hover:text-forest-800 dark:border-forest-400 dark:text-forest-200 dark:hover:bg-forest-900 dark:hover:text-forest-100"
              >
                <Link href="/login">Entrar</Link>
              </Button>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Grátis para começar · sem cartão de crédito
            </p>
          </div>
        </section>

        {/* Como funciona */}
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

        {/* O que entrega */}
        <section className="border-y border-border bg-mint-50/50 dark:bg-forest-950/30">
          <div className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
            <div data-reveal className="max-w-2xl">
              <span className="k-eyebrow">A entrega</span>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Tudo pronto, todo dia.
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

        {/* Por que confiar */}
        <section className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
          <div data-reveal className="max-w-2xl">
            <span className="k-eyebrow">Confiança</span>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Feito com responsabilidade.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Sem atalhos que colocam sua marca em risco. Cada escolha protege
              quem usa e quem é divulgado.
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

        {/* FAQ */}
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

        {/* CTA final */}
        <section className="mx-auto w-full max-w-[1120px] px-6 py-20 sm:px-8 sm:py-28">
          <div
            data-reveal
            className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest-700 to-forest-800 px-8 py-16 text-center"
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
              Grátis para começar · sem cartão de crédito
            </p>
          </div>
        </section>
      </main>

      {/* Rodapé calmo */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <span>© 2026 Kabrito · feito com cuidado no Brasil</span>
          <div className="flex items-center gap-4">
            <Link
              href="/termos"
              className="rounded-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Termos
            </Link>
            <Link
              href="/privacy"
              className="rounded-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </footer>

      {/* Animações GSAP (client, code-split nesta rota). */}
      <LandingReveal />
    </div>
  );
}
