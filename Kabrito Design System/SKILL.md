---
name: kabrito-design
description: Use this skill to generate well-branded interfaces and assets for Kabrito, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Brand:** Kabrito — pt-BR SaaS for wellness / care professionals. Direction: natural · sensível · editorial · elegante.
- **Palette:** 60% Mint Cream `#EBF2EB` (bg) · 25% Black Forest `#075102` (text/CTA) · 10% Powder Blush `#FFACA8` (highlights) · 5% Dusty Rose `#C77577` (editorial details). Rose/Blush never paint the primary CTA or primary text.
- **Type:** Newsreader (serif) for display + headings; Inter for UI/body. Eyebrows UPPERCASE + tracked. No emoji.
- **Tokens:** link `styles.css`; everything is a CSS custom property (`--color-*`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`).
- **Components:** `window.KabritoDesignSystem_0572f5` → Button, IconButton, Input, Checkbox, Switch, Card, Badge, Avatar, Banner, Tabs.
- **Shapes:** cards 12px, fields 6px (squarer), marketing CTAs pill, utility buttons 8px. Shadows barely-there, warm-green tinted. Focus ring is rose.
- **Icons:** Lucide (CDN), 1.75px stroke. **Logo:** `assets/logo-kabrito.svg` (+ inverse, mark).

## Files
- `readme.md` — full design guide (content fundamentals, visual foundations, iconography, index).
- `styles.css` + `tokens/` — the token system.
- `components/` — React primitives (`.jsx` + `.d.ts` + `.prompt.md`).
- `ui_kits/marketing/`, `ui_kits/app/` — full product recreations to copy from.
- `guidelines/` — specimen cards.
- `assets/` — logos + palette reference.
