/**
 * Script use_figma — Tela 3: Fila de revisão (admin) do Kabrito SaaS.
 * Pronto para disparar via mcp__claude_ai_Figma__use_figma:
 *   fileKey: fz90fpgcMNEbnpCzCMfQmb
 *   skillNames: resource:figma-use
 * Posiciona o frame em x=2800 (ao lado de Landing x=0 e Dashboard x=1400).
 * Cole o corpo abaixo como `code`.
 */
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Newsreader', style: 'Medium' }),
]);

const MINT = { r: 0.922, g: 0.949, b: 0.922 };
const INK = { r: 0.027, g: 0.318, b: 0.008 };
const MUTED = { r: 0.243, g: 0.471, b: 0.227 };
const BORDER = { r: 0.851, g: 0.898, b: 0.847 };
const FOREST100 = { r: 0.902, g: 0.933, b: 0.902 };
const MINT50 = { r: 0.969, g: 0.98, b: 0.969 };
const BLUSH100 = { r: 1, g: 0.922, b: 0.918 };
const ROSE50 = { r: 0.984, g: 0.957, b: 0.957 };
const ROSE900 = { r: 0.353, g: 0.208, b: 0.212 };
const WHITE = { r: 1, g: 1, b: 1 };

function txt(s, fam, st, sz, col, o = {}) {
  const t = figma.createText();
  t.fontName = { family: fam, style: st };
  t.characters = s; t.fontSize = sz; t.fills = [{ type: 'SOLID', color: col }];
  if (o.ls != null) t.letterSpacing = { unit: 'PIXELS', value: o.ls };
  if (o.width) { t.textAutoResize = 'HEIGHT'; t.resize(o.width, t.height); }
  return t;
}
function badge(label, bg, fg, brd) {
  const b = figma.createAutoLayout('HORIZONTAL');
  b.paddingLeft = 10; b.paddingRight = 10; b.paddingTop = 3; b.paddingBottom = 3;
  b.cornerRadius = 9999; b.fills = [{ type: 'SOLID', color: bg }];
  if (brd) { b.strokes = [{ type: 'SOLID', color: brd }]; b.strokeWeight = 1; }
  b.appendChild(txt(label, 'Inter', 'Medium', 12, fg));
  return b;
}
function tab(label, active) {
  const t = figma.createAutoLayout('HORIZONTAL');
  t.paddingLeft = 12; t.paddingRight = 12; t.paddingTop = 6; t.paddingBottom = 6;
  t.cornerRadius = 8; t.fills = active ? [{ type: 'SOLID', color: FOREST100 }] : [];
  t.appendChild(txt(label, 'Inter', active ? 'Semi Bold' : 'Medium', 14, active ? INK : MUTED));
  return t;
}

const screen = figma.createAutoLayout('VERTICAL');
screen.name = 'Fila de revisão — Kabrito';
screen.x = 2800; screen.y = 0; screen.itemSpacing = 0;
screen.fills = [{ type: 'SOLID', color: MINT }];
screen.primaryAxisSizingMode = 'FIXED'; screen.counterAxisSizingMode = 'FIXED';
screen.resize(1280, 832);

// Admin topbar
const top = figma.createAutoLayout('HORIZONTAL');
top.counterAxisAlignItems = 'CENTER'; top.primaryAxisAlignItems = 'SPACE_BETWEEN';
top.paddingLeft = 24; top.paddingRight = 24; top.fills = [{ type: 'SOLID', color: WHITE }];
top.strokes = [{ type: 'SOLID', color: BORDER }]; top.strokeBottomWeight = 1; top.strokeTopWeight = 0; top.strokeLeftWeight = 0; top.strokeRightWeight = 0;
screen.appendChild(top); top.layoutSizingHorizontal = 'FILL'; top.resize(top.width, 64); top.counterAxisSizingMode = 'FIXED';
const brandWrap = figma.createAutoLayout('HORIZONTAL'); brandWrap.itemSpacing = 10; brandWrap.counterAxisAlignItems = 'CENTER'; brandWrap.fills = [];
brandWrap.appendChild(txt('Admin · Inteligência Criativa', 'Newsreader', 'Medium', 20, INK, { ls: -0.3 }));
brandWrap.appendChild(badge('superadmin', MINT50, INK, BORDER));
top.appendChild(brandWrap);
const topRight = figma.createAutoLayout('HORIZONTAL'); topRight.itemSpacing = 14; topRight.counterAxisAlignItems = 'CENTER'; topRight.fills = [];
topRight.appendChild(txt('Voltar ao app', 'Inter', 'Medium', 14, MUTED));
const sair = figma.createAutoLayout('HORIZONTAL'); sair.paddingLeft = 14; sair.paddingRight = 14; sair.primaryAxisAlignItems = 'CENTER'; sair.counterAxisAlignItems = 'CENTER';
sair.cornerRadius = 8; sair.fills = []; sair.strokes = [{ type: 'SOLID', color: BORDER }]; sair.strokeWeight = 1;
sair.appendChild(txt('Sair', 'Inter', 'Medium', 14, INK)); sair.resize(70, 36); sair.primaryAxisSizingMode = 'AUTO'; sair.counterAxisSizingMode = 'FIXED';
topRight.appendChild(sair);
top.appendChild(topRight);

// Body
const body = figma.createAutoLayout('VERTICAL'); body.itemSpacing = 22;
body.paddingLeft = 40; body.paddingRight = 40; body.paddingTop = 24; body.paddingBottom = 28; body.fills = [];
screen.appendChild(body); body.layoutSizingHorizontal = 'FILL'; body.layoutSizingVertical = 'FILL';

// Nav tabs
const tabs = figma.createAutoLayout('HORIZONTAL'); tabs.itemSpacing = 4; tabs.fills = [];
tabs.paddingBottom = 8; tabs.strokes = [{ type: 'SOLID', color: BORDER }]; tabs.strokeBottomWeight = 1; tabs.strokeTopWeight = 0; tabs.strokeLeftWeight = 0; tabs.strokeRightWeight = 0;
body.appendChild(tabs); tabs.layoutSizingHorizontal = 'FILL';
tabs.appendChild(tab('Fila de revisão', true));
tabs.appendChild(tab('Fontes', false));
tabs.appendChild(tab('Prompts & taxonomia', false));
tabs.appendChild(tab('Runs & custo', false));

// Header
const head = figma.createAutoLayout('VERTICAL'); head.itemSpacing = 6; head.fills = [];
head.appendChild(txt('REVISÃO', 'Inter', 'Semi Bold', 12, MUTED, { ls: 1 }));
head.appendChild(txt('Fila de revisão', 'Newsreader', 'Medium', 34, INK, { ls: -0.6 }));
head.appendChild(txt('Único passo humano: nada publica sem aprovação.', 'Inter', 'Regular', 16, MUTED));
body.appendChild(head); head.layoutSizingHorizontal = 'FILL';

// Edition rows
const list = figma.createAutoLayout('VERTICAL'); list.itemSpacing = 12; list.fills = [];
body.appendChild(list); list.layoutSizingHorizontal = 'FILL';
function row(title, date, b) {
  const r = figma.createAutoLayout('HORIZONTAL');
  r.counterAxisAlignItems = 'CENTER'; r.primaryAxisAlignItems = 'SPACE_BETWEEN';
  r.paddingLeft = 20; r.paddingRight = 20; r.paddingTop = 16; r.paddingBottom = 16;
  r.cornerRadius = 12; r.fills = [{ type: 'SOLID', color: WHITE }];
  r.strokes = [{ type: 'SOLID', color: BORDER }]; r.strokeWeight = 1;
  const col = figma.createAutoLayout('VERTICAL'); col.itemSpacing = 3; col.fills = [];
  col.appendChild(txt(title, 'Inter', 'Medium', 15, INK));
  col.appendChild(txt(date, 'Inter', 'Regular', 13, MUTED));
  r.appendChild(col);
  r.appendChild(b);
  list.appendChild(r); r.layoutSizingHorizontal = 'FILL';
}
row('Inteligência Criativa — Instagram — 2026-06-13', 'Gerada pelo pipeline · aguardando revisão', badge('Pendente', BLUSH100, ROSE900));
row('Inteligência Criativa — Instagram — 2026-06-12', 'Em revisão por você', badge('Em revisão', MINT50, INK, BORDER));
row('Inteligência Criativa — Instagram — 2026-06-11', 'Rejeitada · motivo registrado', badge('Rejeitada', ROSE50, ROSE900, { r: 0.937, g: 0.847, b: 0.851 }));

return { createdNodeIds: [screen.id], screen: screen.id, name: screen.name };
