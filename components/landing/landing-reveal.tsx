"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animações da landing (GSAP + ScrollTrigger). Renderiza nada — só anexa as
 * animações aos elementos com data-hero / data-reveal / data-parallax já no DOM.
 *
 * Acessível e sem flash: o CSS pré-esconde esses elementos APENAS quando o
 * usuário aceita movimento (prefers-reduced-motion: no-preference). Aqui:
 *  - reduced-motion → não anima (elementos já visíveis pelo CSS).
 *  - caso contrário → revela com fade/sobe no load (hero) e no scroll (seções).
 * Carregado só nesta rota (code-split) — o app/dashboard não importa GSAP.
 */
export function LandingReveal() {
  useGSAP(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // respeita a preferência: sem animação, conteúdo visível
    }

    // Hero entra em cascata no carregamento.
    gsap.fromTo(
      "[data-hero] > *",
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.09 },
    );

    // Seções revelam ao entrar na viewport.
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });

    // Parallax sutil no respiro de cor do hero.
    gsap.to("[data-parallax]", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-parallax]",
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
      },
    });
  });

  return null;
}
