import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Trust } from "@/components/landing/trust";
import { Faq, FAQS } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { Logo } from "@/components/layout/logo";

// Mesmo fallback de produção do metadataBase em app/layout.tsx.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kabrito.vercel.app";

// JSON-LD (SEO-4) — Organization + SoftwareApplication da landing, e o FAQPage
// espelhando o accordion de FAQS abaixo (mesmas perguntas/respostas exibidas,
// sem inventar dado que não está na página — ex.: sem `offers`/preço).
const ORG_SOFTWARE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Kabrito",
      url: APP_URL,
      logo: `${APP_URL}/brand/logo-kabrito.svg`,
    },
    {
      "@type": "SoftwareApplication",
      name: "Kabrito",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description:
        "Central diária de inteligência criativa para criadores de conteúdo e social media: pautas, copy, headlines e prompts — gerados por IA e revisados por humanos antes de publicar.",
    },
  ],
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

/** Landing page pública — hero editorial + seções de conversão (GSAP no scroll). */
export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Habilita a pré-ocultação só quando há JS (.js-reveal), e arma um failsafe:
          se o GSAP não inicializar (chunk falhou/erro), reexibe tudo após 4s.
          Sem JS, nada disso roda → conteúdo sempre visível. */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var h=document.documentElement;h.classList.add('js-reveal');window.setTimeout(function(){if(!window.__kReveal)h.classList.remove('js-reveal');},4000);})();",
        }}
      />

      {/* JSON-LD (SEO-4) — dado estático, sem entrada de usuário. */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ORG_SOFTWARE_JSON_LD),
        }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      {/* Topo fixo — CTA sempre ao alcance */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-landing items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Kabrito · página inicial"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
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
        <Hero />
        <HowItWorks />
        <Features />
        <Trust />
        <Faq />
        <Cta />
      </main>

      {/* Rodapé calmo */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-landing flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <span>© 2026 Kabrito · feito com cuidado no Brasil</span>
          <div className="flex items-center gap-4">
            <Link
              href="/termos"
              className="rounded-sm k-transition hover:text-foreground k-focus"
            >
              Termos
            </Link>
            <Link
              href="/privacy"
              className="rounded-sm k-transition hover:text-foreground k-focus"
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
