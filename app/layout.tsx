import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieNotice } from "@/components/cookie-notice";
import "./globals.css";

// Inter (UI/body) + Newsreader (editorial serif display) — pareamento Kabrito.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kabrito.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Inteligência Criativa · Kabrito",
  applicationName: "Kabrito",
  description:
    "Central diária de inteligência criativa para criadores de conteúdo e social media: pautas, copy, headlines e prompts — gerados por IA e revisados por humanos antes de publicar.",
  keywords: [
    "inteligência criativa",
    "social media",
    "criação de conteúdo",
    "pautas",
    "copywriting",
    "prompts de IA",
    "Kabrito",
  ],
  // A imagem (app/opengraph-image.tsx) é ligada automaticamente pelo Next.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Kabrito",
    url: APP_URL,
    title: "Inteligência Criativa · Kabrito",
    description:
      "Pautas, copy, headlines e prompts — gerados por IA e revisados por humanos antes de publicar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inteligência Criativa · Kabrito",
    description:
      "Conteúdo que cuida, com respiro — inteligência criativa diária para social media.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Anti-flash de tema: define .dark ANTES da pintura (localStorage > sistema). */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        {children}
        <CookieNotice />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
