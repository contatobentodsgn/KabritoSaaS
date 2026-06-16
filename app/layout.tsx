import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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

export const metadata: Metadata = {
  title: "Inteligência Criativa · Kabrito",
  description:
    "Central diária de inteligência criativa para criadores de conteúdo e social media. Cuidado editorial, revisão humana.",
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
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
