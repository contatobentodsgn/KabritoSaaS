# Kabrito — Marketing UI Kit

A full-bleed recreation of the Kabrito marketing site, composing the design-system primitives (`Button`, `Card`, `Badge`) over the brand tokens.

**Product story:** Kabrito is a SaaS for wellness / care professionals (psicólogas, terapeutas, educadores) — agenda + clientes + conteúdo editorial in one calm place. Copy is pt-BR.

## Files
- `index.html` — the composed, scrollable landing page (open this).
- `marketing.jsx` — section components exported to `window.KMarketing`: `MarketingNav`, `MarketingHero` (+ `MockApp`), `MarketingFeatures`, `EditorialBand`, `MarketingPricing`, `MarketingFooter`. Inline icon set `I` (Leaf, Calendar, Pen, Heart, Arrow, Check, Star).

## Sections (top → bottom)
1. **Nav** — sticky, blurred Mint Cream; wordmark + pill CTA.
2. **Hero** — `gradient-soft` band, serif headline with rose italic, CTA pair, mocked app card.
3. **Features** — 3 `Card`s with forest-soft icon tiles.
4. **Editorial band** — the single Black Forest "night" moment; serif testimonial.
5. **Pricing** — 3 tiers, middle featured (white + rose border + shadow + "Mais popular").
6. **Footer** — Mint Cream band, link directory.

## Notes
- Imagery is mocked (the app card) rather than photographic — swap in real product screenshots / lifestyle photography (warm, natural) when available.
- Reserve the Black Forest editorial band for one moment per page.
