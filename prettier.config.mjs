/**
 * Prettier — a maioria das opções aqui já são o DEFAULT do Prettier 3; estão
 * explícitas por clareza (o estilo do código já seguia essas convenções antes
 * do formatter existir: aspas duplas, ponto-e-vírgula, 2 espaços). Fase 0.4
 * (IMPROVEMENTS-PLAN.md DX-3/DX-4).
 */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,
  // Explícito (é o default) — trava contra reflow de prosa nos .md em versões
  // futuras do Prettier; só normaliza estrutura (ex.: linha em branco após heading).
  proseWrap: "preserve",
};
