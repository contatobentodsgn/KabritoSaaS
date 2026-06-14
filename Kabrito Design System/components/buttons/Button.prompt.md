Primary action button — use for any tappable action; `primary` (Black Forest) is the single confident CTA per view, `secondary` (Powder Blush) for warm supporting actions.

```jsx
<Button variant="primary" size="md">Começar agora</Button>
<Button variant="secondary" iconLeft={<Sparkle/>}>Destaque</Button>
<Button variant="outline">Saiba mais</Button>
<Button variant="ghost" size="sm">Cancelar</Button>
<Button variant="primary" shape="pill" size="lg">Criar conta grátis</Button>
```

Variants: `primary` · `secondary` · `outline` · `ghost`. Sizes: `sm` · `md` · `lg`. Use `shape="pill"` for marketing CTAs, default `rounded` (8px) for app/utility. Reserve `primary` for the one authoritative action; never paint a CTA in a decorative scale color.
