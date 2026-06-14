# Kabrito — App UI Kit

A high-fidelity recreation of the Kabrito product app, composing the design-system primitives over the brand tokens. Copy is pt-BR.

**Product story:** the working surface for a wellness professional — agenda, clientes, and editorial conteúdos in one calm shell.

## Files
- `index.html` — the running app (open this). Click the sidebar to switch views.
- `app.jsx` — `window.KApp.AppShell` plus `Sidebar`, `Topbar`, and views `ViewInicio`, `ViewClientes`, `ViewConteudos`, and a `Placeholder` for undetailed areas. Inline icon set `Ic`.

## Screens
1. **Início (Dashboard)** — 3 stat cards, today's agenda list, a Black Forest editorial highlight + a blush reminder.
2. **Clientes** — searchable data table (avatar, name, last session, status badge).
3. **Conteúdos** — editorial content grid with gradient covers + status badges.
4. **Agenda / Faturamento / Configurações** — intentionally left as labelled placeholders (not detailed in the source).

## Composition
- Shell = `Sidebar` (forest-soft active row) + `Topbar` (serif page title, search, `IconButton` bell) + scrollable `main`.
- Uses `Button`, `IconButton`, `Card`, `Badge`, `Avatar`, `Input` from `KabritoDesignSystem_0572f5`.

## Notes
- Interactions are cosmetic (view switching); data is static mock content.
- Reserve the Black Forest editorial card for one moment per screen.
