/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Segredos de servidor NUNCA são expostos: apenas NEXT_PUBLIC_* chega ao client.
  // Não declaramos `env` aqui para evitar vazamento acidental de segredos no bundle.
  experimental: {
    // Server Actions habilitadas por padrão no Next 15.
  },
  // Headers de hardening (HTTPS já é forçado pela Vercel). frame-ancestors/DENY
  // protege contra clickjacking numa app autenticada. Sem CSP de script por ora
  // (evitar quebrar o domínio do Supabase Storage/realtime) — adicionar depois com cuidado.
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
