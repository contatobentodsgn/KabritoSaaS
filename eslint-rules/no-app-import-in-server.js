/**
 * ESLint rule: no-app-import-in-server
 * ---------------------------------------------------------------------------
 * Falha se um arquivo em server/** importar de app/**. server/ é a camada de
 * infraestrutura (auth, db, actions, pipeline); app/ é apresentação (rotas,
 * componentes). A dependência só pode ir de app → server, nunca o contrário
 * (senão server passa a depender de Server Components/rotas específicas,
 * quebrando reuso e testabilidade). Ver eslint.config.mjs.
 */

function isAppImport(source) {
  return source === "@/app" || source.startsWith("@/app/");
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Proíbe server/** de importar de app/** (camada de infraestrutura não pode depender da camada de apresentação).",
    },
    schema: [],
    messages: {
      appImport:
        'server/** não pode importar "{{source}}". app/ é a camada de apresentação; a dependência só vai de app → server, nunca o contrário.',
    },
  },
  create(context) {
    function check(node) {
      const source = node.source?.value;
      if (typeof source === "string" && isAppImport(source)) {
        context.report({ node, messageId: "appImport", data: { source } });
      }
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
