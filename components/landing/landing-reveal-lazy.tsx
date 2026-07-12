"use client";

import dynamic from "next/dynamic";

/**
 * Wrapper "use client" só para poder usar `ssr: false` no `next/dynamic`
 * (PERF-9). O Next.js recusa `ssr: false` num `dynamic()` chamado direto de
 * dentro de um Server Component (app/page.tsx lê headers(), então não pode
 * virar "use client") — "`ssr: false` is not allowed with `next/dynamic` in
 * Server Components. Please move it into a Client Component." Este arquivo
 * existe só por essa restrição de build; toda a lógica de animação continua
 * em landing-reveal.tsx (não alterado).
 *
 * Code-split o GSAP para fora do bundle inicial da landing: LandingReveal
 * renderiza null e só existe pelo efeito colateral (anima
 * [data-hero]/[data-reveal] no scroll), então não faz sentido nem SSR nem
 * bloquear o primeiro load com o bundle do GSAP. O failsafe .js-reveal
 * (app/page.tsx, timeout de 4s) já cobre o GSAP carregando tarde ou
 * falhando — mesmo mecanismo, sem mudança de lógica.
 */
export const LandingReveal = dynamic(
  () =>
    import("@/components/landing/landing-reveal").then((m) => m.LandingReveal),
  { ssr: false },
);
