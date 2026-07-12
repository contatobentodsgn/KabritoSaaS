import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Chaves semânticas do tema (tailwind.config.ts: fontSize/spacing/maxWidth do
// Kabrito Design System) — sem isto, o tailwind-merge não reconhece
// `text-button`/`p-lg`/`max-w-landing` como parte do grupo certo e pode
// descartar a classe por engano (achado real: `text-button` sumia porque o
// tailwind-merge classificava como cor de texto, não tamanho de fonte, e
// "ganhava" de `text-primary-foreground` no merge).
const SPACING_KEYS = ["xxs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"];
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-1",
        "text-display-2",
        "text-heading-1",
        "text-heading-2",
        "text-heading-3",
        "text-title",
        "text-body-md",
        "text-body-sm",
        "text-button",
        "text-caption",
        "text-eyebrow",
      ],
      p: SPACING_KEYS.map((k) => `p-${k}`),
      px: SPACING_KEYS.map((k) => `px-${k}`),
      py: SPACING_KEYS.map((k) => `py-${k}`),
      pt: SPACING_KEYS.map((k) => `pt-${k}`),
      pr: SPACING_KEYS.map((k) => `pr-${k}`),
      pb: SPACING_KEYS.map((k) => `pb-${k}`),
      pl: SPACING_KEYS.map((k) => `pl-${k}`),
      m: SPACING_KEYS.map((k) => `m-${k}`),
      mx: SPACING_KEYS.map((k) => `mx-${k}`),
      my: SPACING_KEYS.map((k) => `my-${k}`),
      mt: SPACING_KEYS.map((k) => `mt-${k}`),
      mr: SPACING_KEYS.map((k) => `mr-${k}`),
      mb: SPACING_KEYS.map((k) => `mb-${k}`),
      ml: SPACING_KEYS.map((k) => `ml-${k}`),
      gap: SPACING_KEYS.map((k) => `gap-${k}`),
      "gap-x": SPACING_KEYS.map((k) => `gap-x-${k}`),
      "gap-y": SPACING_KEYS.map((k) => `gap-y-${k}`),
      "max-w": ["max-w-landing"],
    },
  },
});

/** Merge condicional de classes Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
