import { AtSign, LayoutGrid, Tag, Target, ChevronDown, SlidersHorizontal } from "lucide-react";

/**
 * Chips de contexto da edição (canal/formato/nicho/objetivo).
 * Display-only no MVP — a filtragem sob demanda entra no MVP 2 (Trend Translator /
 * "adaptar para meu nicho"). Aqui dão contexto e a aparência da imagem-alvo.
 */
const CHIPS = [
  { icon: AtSign, label: "Canal", value: "Instagram" },
  { icon: LayoutGrid, label: "Formato", value: "Reels" },
  { icon: Tag, label: "Nicho", value: "Geral" },
  { icon: Target, label: "Objetivo", value: "Engajar" },
];

export function FilterChips() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIPS.map(({ icon: Icon, label, value }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-mint-200 bg-card px-3 py-1.5 text-sm text-foreground"
          title="Filtro de contexto (em breve)"
        >
          <Icon className="size-4 text-mint-700" strokeWidth={1.75} />
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">{value}</span>
          <ChevronDown className="size-3.5 text-mint-600" />
        </span>
      ))}
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground">
        <SlidersHorizontal className="size-4" strokeWidth={1.75} />
        Limpar filtros
      </span>
    </div>
  );
}
