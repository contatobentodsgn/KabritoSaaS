# Kabrito Design System

> **Direction:** natural · sensível · editorial · elegante
> A warm, paper-calm SaaS system for wellness, health, self-care, beauty and education brands — built on a Mint Cream canvas, Black Forest authority type, and a quiet Rose/Blush accent palette that does the emotional work while the chrome stays calm.

Kabrito is a Brazilian (pt-BR) SaaS brand. Its surface looks like a well-kept studio in soft morning light: a dominant **Mint Cream** off-white canvas, editorial **Newsreader** serif headlines in near-forest **Black Forest** green, clean **Inter** for everything functional, and small, deliberate touches of **Dusty Rose** and **Powder Blush** for warmth and emotion. The system whispers in greens and creams, then says exactly the warm things in rose.

The structural skeleton (type scale, spacing, radii, elevation philosophy, component set) is inherited from a Notion-style productivity base and **fully recolored** to the Kabrito palette, with a serif display added to carry the editorial-elegante brand voice.

## Sources

These materials were provided and analyzed to build this system. Stored here in case the reader has access:

- **`uploads/Kabrito Saas.png`** — the palette board (Brand colors, primitive scales, semantic tokens, component preview, 60/25/10/5 balance). Mirrored to `assets/palette-reference.png`.
- **`uploads/Kabrito Saas.docx`** — "Direcionamento de Design System" — the full written spec: color roles, primitive scales (50→950), semantic CSS tokens, accessibility notes, gradients, and component application rules. This is the source of truth for all token values.
- **`uploads/DESIGN-notion.md`** — the structural base (typographic scale, spacing, radii, elevation, component inventory) which was recolored to Kabrito.
- Brand domain: **kabritodigital.com**.

There was **no codebase or Figma** for a real Kabrito product, and no proprietary fonts or icon set. The UI kits therefore follow the documented component inventory recolored to the brand, and fonts/icons are flagged open-source substitutions (see Iconography + Caveats).

---

## Content Fundamentals

**Language.** Product and marketing copy is **Brazilian Portuguese (pt-BR)**. Documentation (this readme, component prompts) is in English for the design team.

**Voice.** Warm, human, sophisticated — never clinical, never hypey. The brand speaks to caregivers and creators (psicólogas, terapeutas, educadores, profissionais de bem-estar). It uses **"você"** (informal-but-respectful second person), addresses the reader directly, and favors calm, declarative sentences over urgency.

**Tone in practice:**
- **Editorial, not transactional.** Headlines read like a magazine cover: *"Cuidar é editorial"*, *"Um respiro de calma"*. They use serif and earn their space.
- **Reassuring, not loud.** Supporting copy is gentle and concrete: *"Mint Cream como base, com textos em verde escuro e um toque de rosa para destaque."*
- **Sentence case** everywhere except eyebrows (which are UPPERCASE, tracked). Never ALL-CAPS a headline.
- **Minimal punctuation drama.** Few exclamation marks; a single one reserved for genuine delight (*"Tudo certo!"*).

**Casing:** Headlines & body → sentence case. Buttons → sentence case (*"Começar agora"*, *"Saiba mais"*). Eyebrows → UPPERCASE + 1px tracking. Hex/tokens in mono.

**Emoji:** **None.** The brand's warmth comes from color, serif type and the leaf mark — not emoji. Don't introduce them.

**Vibe words to write toward:** acolhedor, sensível, leve, com respiro, editorial, cuidado, presença.

**Example microcopy (pt-BR):**
- CTA primary: *"Criar conta grátis"*, *"Começar agora"*
- CTA secondary: *"Saiba mais →"*, *"Falar com a gente"*
- Empty state: *"Nada por aqui ainda. Que tal começar pelo primeiro conteúdo?"*
- Success: *"Tudo certo! Suas alterações foram salvas."*

---

## Visual Foundations

**Palette & vibe.** Green-forward and warm. **60% Mint Cream** (`#EBF2EB`) backgrounds, **25% Black Forest** (`#075102`) for text/CTAs/icons, **10% Powder Blush** (`#FFACA8`) for soft highlights and emotional blocks, **5% Dusty Rose** (`#C77577`) for editorial details, chips and dividers. Rose and Blush are **never** the primary text color and never paint a primary CTA — Black Forest owns authority; Blush owns the warm secondary action.

**Color of imagery.** Warm, soft, natural — morning light, plants, skin tones, paper textures. Never cold, never high-contrast clinical. Photography sits in rounded `--radius-lg`/`--radius-xl` wells with a hairline edge; no heavy art-direction crops.

**Type.** Two families. **Newsreader** (serif) carries display + headings 1–2 with gentle negative tracking (−0.8 to −1.5px) — this is the editorial signature. **Inter** carries heading-3, titles, body, buttons, captions and the UPPERCASE eyebrow. Body stays 400 weight at a comfortable 1.55 line-height for long, document-like reading. The expressive lever is the contrast between a 500-weight serif headline and calm 400 Inter body.

**Backgrounds.** Predominantly flat Mint Cream / white — calm and paper-like. **No** busy patterns. Gradients exist (`--gradient-soft`, `--gradient-warm`, `--gradient-editorial`) but are reserved for hero sections, special cards and editorial moments — never behind small text. A single **editorial moment** per page may invert to a Black Forest fill (`Card variant="editorial"` / hero band) — used once, like Notion's dark hero, not repeated.

**Spacing & layout.** 8px base. Whitespace is the primary grouping device — generous *respiro* (breathing room), large vertical gaps between sections rather than rules. Content centers in a ~1080–1280px column with generous gutters. Cards sit on the canvas with quiet hairlines, not heavy frames.

**Corners.** Friendly but restrained. Cards round at 12px (`--radius-lg`), large containers 16–24px, marketing CTAs are pill (`--radius-full`), utility/app buttons 8px (`--radius-md`). **Form fields stay tight at 6px (`--radius-sm`)** — deliberately squarer than the pills.

**Borders.** Hairline `--color-border-default` (`#D9E5D8`, a soft mint) for most dividers and card edges; `--color-border-strong` for emphasis; `--color-border-accent` (rose) on warm/blush surfaces.

**Elevation.** Barely-there. Shadows are multi-layer and faintly **warm-green tinted** (`rgba(7,81,2,…)`) so surfaces lift gently off the Mint canvas rather than drop hard. Most cards rely on a hairline alone (level 0). Levels 1→3 for cards, popovers, modals.

**Animation.** Calm and quick. 140–160ms ease transitions on color/shadow; a subtle `scale(0.97)` press on buttons; a gentle `translateY(-2px)` lift on interactive cards. No bounces, no infinite decorative loops. Easing favors `ease` and `cubic-bezier(0.2,0.8,0.2,1)` for the switch knob.

**Hover states.** Primary → darker forest (`--forest-800`); secondary → deeper blush (`--blush-500`); outline → faint mint fill + soft shadow; ghost → forest-soft wash. Never opacity-only.

**Press states.** Slight shrink (`scale(0.97)`) + the darker hover color. Pressed primary can go to `--forest-950`.

**Focus.** A **rose** ring — `0 0 0 3px var(--color-secondary-soft)` — on inputs and interactive fields (per the brand input spec), with the border shifting to `--color-border-focus` (Dusty Rose).

**Transparency / blur.** Used sparingly — translucent overlays for modals (forest at low alpha), optional backdrop blur on sticky nav. Not a core motif.

---

## Iconography

- **Set:** **Lucide** (`https://unpkg.com/lucide@latest`), linked from CDN. Clean **1.75px** line icons with rounded caps and joins — the humanist, gently-rounded line style suits the natural/wellness voice far better than a heavy or geometric set.
- **Substitution flag:** no proprietary Kabrito icon set was provided. Lucide is the chosen substitute; swap for a licensed set if the brand has one.
- **Color:** icons inherit `currentColor` — almost always Black Forest (`--color-text-primary`) or muted mint; rose/blush only for decorative or emotional accents.
- **Sizing:** 16–18px inline with text, 20–24px standalone, 44px minimum touch target on mobile.
- **No emoji, no unicode glyph-as-icon.** The only bespoke vector mark is the **leaf** in the logo (`assets/logo-mark.svg`), which echoes the leaf motif from the palette board.
- **Usage:** pair icons with `IconButton` for actions; use them as quiet leading affordances in nav rows and list items, never as decorative clutter.

---

## Index

**Root**
- `styles.css` — the single entry point consumers link. `@import`s everything below.
- `readme.md` — this file.
- `SKILL.md` — Agent-Skill manifest for downloadable use.

**`tokens/`** — `fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `elevation.css` · `base.css` (reset + `.k-*` type-role utilities).

**`assets/`** — `logo-kabrito.svg` (primary), `logo-kabrito-inverse.svg` (on dark), `logo-mark.svg` (leaf mark), `palette-reference.png`.

**`components/`** — reusable React primitives (namespace `KabritoDesignSystem_0572f5`):
- `buttons/` — **Button**, **IconButton**
- `forms/` — **Input**, **Checkbox**, **Switch**
- `data-display/` — **Card**, **Badge**, **Avatar**
- `feedback/` — **Banner**
- `navigation/` — **Tabs**

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**`ui_kits/`** — full-screen product recreations:
- `marketing/` — Kabrito marketing site (hero, features, pricing, footer)
- `app/` — Kabrito app shell (sidebar, dashboard, table, content)

---

## Caveats

- **Fonts are substitutions.** Newsreader (display) + Inter (UI) are the nearest open-source matches on Google Fonts, loaded via `@import`. If Kabrito has licensed brand fonts, provide the files and I'll wire real `@font-face` rules.
- **Icons are a substitution** (Lucide) — see Iconography.
- **Logo is interpretive.** No logo file was supplied; the wordmark + leaf mark were authored to match the brand's serif/leaf cues. Replace with the official logo when available.
- **No real product** (codebase/Figma) was provided, so the UI kits are plausible recreations following the documented component inventory, recolored to brand — not copies of a shipped product.
