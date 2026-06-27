import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Segredos de servidor NUNCA são expostos: apenas NEXT_PUBLIC_* chega ao client.
  // Não declaramos `env` aqui para evitar vazamento acidental de segredos no bundle.
  experimental: {
    // Server Actions habilitadas por padrão no Next 15.
  },
  // Headers de hardening estáticos (HTTPS já é forçado pela Vercel). A CSP NÃO
  // vive aqui: por usar nonce por requisição, é montada e aplicada no middleware
  // (lib/security/csp.ts + middleware.ts), hoje em modo ENFORCING.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Desliga APIs sensíveis não usadas + opt-out do Topics API do Chrome
            // (browsing-topics) — privacidade, sem custo.
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

// withSentryConfig injeta o SDK e instrumenta o build. O upload de sourcemaps só
// acontece quando SENTRY_AUTH_TOKEN/ORG/PROJECT existem — sem eles, o build segue
// normal (sem upload). silent evita ruído no log da Vercel.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Evita expor o nome do projeto em rotas e desabilita telemetria do plugin.
  telemetry: false,
});
