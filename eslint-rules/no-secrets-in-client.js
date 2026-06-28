/**
 * ESLint rule: no-secrets-in-client
 * ---------------------------------------------------------------------------
 * Falha se um arquivo marcado com a diretiva "use client" referenciar um
 * segredo de servidor via process.env. Implementa, no nível de lint/CI, o
 * item "Nada secreto em componente client" (SECURITY_GUIDE §5).
 *
 * Defesa em profundidade: server/env.ts e service-client.ts importam
 * "server-only", o que já FAZ O BUILD FALHAR. Esta regra pega o problema
 * mais cedo (lint) e cobre acessos diretos a process.env.
 */

const SERVER_SECRETS = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "CRON_SECRET",
  "AI_API_KEY",
  "RESEND_API_KEY",
  "BREVO_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SENTRY_DSN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
]);

function isProcessEnv(objectNode) {
  return (
    objectNode &&
    objectNode.type === "MemberExpression" &&
    objectNode.object.type === "Identifier" &&
    objectNode.object.name === "process" &&
    objectNode.property.type === "Identifier" &&
    objectNode.property.name === "env"
  );
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        'Proíbe referência a segredos de servidor em arquivos "use client".',
    },
    schema: [],
    messages: {
      secret:
        'Segredo de servidor "{{name}}" não pode ser referenciado em componente client ("use client"). Mova o acesso para código de servidor (server/).',
    },
  },
  create(context) {
    let isClientFile = false;

    return {
      Program(node) {
        for (const stmt of node.body) {
          // Diretivas ficam no topo; pare ao encontrar a primeira não-diretiva.
          if (
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "Literal" &&
            stmt.expression.value === "use client"
          ) {
            isClientFile = true;
            break;
          }
          if (
            stmt.type === "ExpressionStatement" &&
            (stmt.expression.type === "Literal" ||
              stmt.expression.type === "TemplateLiteral")
          ) {
            continue; // outra diretiva ("use strict" etc.)
          }
          break;
        }
      },
      MemberExpression(node) {
        if (!isClientFile) return;
        // process.env.SECRET
        if (
          isProcessEnv(node.object) &&
          node.property.type === "Identifier" &&
          SERVER_SECRETS.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "secret",
            data: { name: node.property.name },
          });
        }
        // process.env["SECRET"]
        if (
          isProcessEnv(node.object) &&
          node.computed &&
          node.property.type === "Literal" &&
          typeof node.property.value === "string" &&
          SERVER_SECRETS.has(node.property.value)
        ) {
          context.report({
            node,
            messageId: "secret",
            data: { name: node.property.value },
          });
        }
      },
    };
  },
};
