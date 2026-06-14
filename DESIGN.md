# DESIGN.md — Kabrito

> Fonte da verdade visual: `Kabrito Design System/` (tokens, readme, ui_kits, assets).
> Direção: **natural · sensível · editorial · elegante**. Tela de papel em luz da manhã.

## Tokens (já cabeados)
- **Cores** → mapeadas nas vars shadcn em `app/globals.css`; escalas de marca (`forest/mint/rose/blush`) no `tailwind.config.ts`.
- **Fontes** → `next/font`: Inter (`--font-sans`, UI/body) + Newsreader (`--font-serif`, display/headings).
- **Raios** → fields 6px (`rounded-sm`), botões utilitários 8px (`rounded-md`), cards 12px (`rounded-lg`), CTA marketing pill (`rounded-full`).
- **Sombras** → `shadow-k-1/2/3` (warm-green tinted, barely-there). Maioria dos cards = hairline only.

## Paleta (balance 60/25/10/5)
- **60% Mint Cream** `#EBF2EB` — fundo (`bg-background`).
- **25% Black Forest** `#075102` — texto, ícones, **CTA primário** (`text-foreground`, `bg-primary`, `forest-700`).
- **10% Powder Blush** `#FFACA8` — destaques, **ação secundária quente** (`<Button variant="blush">`, `blush-400` com texto forest).
- **5% Dusty Rose** `#C77577` — detalhes editoriais, chips, **anel de foco** (rosa), dividers.
- **Regra dura:** rose/blush **nunca** pintam o texto primário nem o CTA primário. Verde detém a autoridade.

## Tipografia
- **Newsreader (serif)** → display + h1/h2 (peso 500, tracking −0.02em). É a assinatura editorial.
- **Inter** → h3, títulos, body (400, line-height ~1.55), botões (500), captions, **eyebrow** (`.k-eyebrow` UPPERCASE tracked).
- Sentence case em tudo (exceto eyebrow). Nunca ALL-CAPS num headline.

## Componentes (shadcn re-temáticos)
- `Button`: `default` (forest), `blush` (ação secundária), `outline`, `ghost`, `secondary` (mint suave), `link`; size `pill` p/ marketing. Press `scale(0.97)`.
- `Card`: branco, hairline `border`, 12px, título em serif. **Cards aninhados são sempre errado.**
- `Input`/`Textarea`: 6px, foco com anel **rosa** + borda rose.
- `Badge`: tons `forest`/`blush`/`rose`/`secondary`/`outline` (+ success=forest, warning=blush).
- Ícones: **Lucide**, stroke 1.75, herdam `currentColor` (quase sempre forest). Logo: `/brand/logo-kabrito.svg` (+ inverse/mark).

## Regras (impeccable + Kabrito)
- **Sem emoji.** Calor vem de cor + serif + folha do logo.
- Contraste: body ≥ 4.5:1 (muted-foreground já é verde escuro, não cinza claro).
- Respiro generoso; whitespace é o agrupador; coluna ~1080–1280px.
- Um **único momento editorial** por página pode inverter para fundo Black Forest (hero/banner). Não repita.
- Movimento calmo: 140–160ms ease; sem bounce; respeitar `prefers-reduced-motion`.
- Foco visível sempre (anel rosa). Estados de hover nunca só opacidade.
