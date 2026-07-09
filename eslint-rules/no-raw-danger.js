import path from "node:path";

/**
 * ESLint rule: no-raw-danger
 * ---------------------------------------------------------------------------
 * Falha se `dangerouslySetInnerHTML` for usado fora do ALLOWLIST abaixo
 * (IMPROVEMENTS-PLAN.md SEC-5). O React escapa toda interpolação em JSX
 * normal; `dangerouslySetInnerHTML` é a única porta de XSS-por-engano no
 * client. Cada uso hoje é revisado e documentado; um uso NOVO precisa ser
 * adicionado aqui conscientemente (com o motivo), não deslizar sem revisão.
 */

const ALLOWLIST = new Set([
  // Script estático (anti-flash de tema): string literal fixa, sem
  // interpolação de dado externo/usuário; nonce CSP aplicado.
  "app/layout.tsx",
  // Script estático (scroll-reveal da landing): idem — literal fixa, nonce CSP.
  "app/page.tsx",
  // QR (SVG) de ativação do MFA: vem do Supabase Auth (server-only, gated por
  // sessão autenticada), não de input de usuário. Ver components/forms/mfa-settings.tsx.
  "components/forms/mfa-settings.tsx",
]);

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Bane dangerouslySetInnerHTML fora do allowlist revisado (anti-XSS).",
    },
    schema: [],
    messages: {
      notAllowlisted:
        "dangerouslySetInnerHTML fora do allowlist revisado (eslint-rules/no-raw-danger.js). Se este uso é seguro (sem HTML de terceiro/usuário não sanitizado), adicione o arquivo ao ALLOWLIST com o motivo documentado.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.type !== "JSXIdentifier" || node.name.name !== "dangerouslySetInnerHTML") {
          return;
        }
        const filename = context.filename ?? context.getFilename();
        const rel = path.relative(process.cwd(), filename).split(path.sep).join("/");
        if (ALLOWLIST.has(rel)) return;
        context.report({ node, messageId: "notAllowlisted" });
      },
    };
  },
};
