/**
 * Lista canônica dos cards do dashboard (key + rótulo). Fonte da verdade para:
 *  - o seed/visibilidade na tabela `dashboard_cards` (chaves),
 *  - a tela de admin que liga/desliga cada card,
 *  - o QuickAccess (que casa estas keys com o conteúdo do card no código).
 * Manter em sincronia com o seed da migration 0010 e com QuickAccess.
 */
export const DASHBOARD_CARDS = [
  { key: "trends", label: "Pautas quentes" },
  { key: "explore", label: "Radar de Descoberta" },
  { key: "copy", label: "Análise de copy" },
  { key: "suggestions", label: "Sugestões de post" },
  { key: "headlines", label: "Headlines" },
  { key: "visual", label: "Análise visual" },
  { key: "prompts", label: "Prompts" },
  { key: "favorites", label: "Favoritos" },
  { key: "adaptar", label: "Adaptar ao meu nicho" },
  { key: "calendario", label: "Calendário editorial" },
] as const;

export type DashboardCardKey = (typeof DASHBOARD_CARDS)[number]["key"];

export const DASHBOARD_CARD_KEYS = DASHBOARD_CARDS.map((c) => c.key) as DashboardCardKey[];
