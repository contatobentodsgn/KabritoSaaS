import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://kabrito.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Não indexar o app autenticado nem as APIs.
      disallow: [
        "/dashboard",
        "/daily-briefing",
        "/trends",
        "/headlines",
        "/prompts",
        "/adaptar",
        "/calendario",
        "/favorites",
        "/settings",
        "/admin",
        "/redefinir-senha",
        "/convite",
        "/api/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
