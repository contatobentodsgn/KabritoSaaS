import type { Config } from "tailwindcss";

/**
 * Tailwind alinhado ao Kabrito Design System.
 * - Cores semânticas via CSS vars (shadcn) já remapeadas para a paleta Kabrito em globals.css.
 * - Escalas de marca (forest/mint/rose/blush) expostas para uso direto.
 * - Raios e fontes seguem os tokens Kabrito.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── Escalas de marca Kabrito (hex) ──
        forest: {
          50: "#f3f6f2", 100: "#e6eee6", 200: "#cddccc", 300: "#a8c2a6",
          400: "#779f74", 500: "#457c41", 600: "#20621b", 700: "#075102",
          800: "#064502", 900: "#053901", 950: "#042d01",
        },
        mint: {
          50: "#f7faf7", 100: "#ebf2eb", 200: "#d9e5d8", 300: "#c7d8c6",
          400: "#abc5aa", 500: "#90b28e", 600: "#749e72", 700: "#598b56",
          800: "#3e783a", 900: "#22641e", 950: "#155b10",
        },
        rose: {
          50: "#fbf4f4", 100: "#f6e9e9", 200: "#efd8d9", 300: "#e6c1c2",
          400: "#d89ea0", 500: "#c77577", 600: "#af6769", 700: "#955859",
          800: "#774647", 900: "#5a3536", 950: "#3c2324",
        },
        blush: {
          50: "#fff5f5", 100: "#ffebea", 200: "#ffd8d5", 300: "#ffc4c0",
          400: "#ffaca8", 500: "#f19e9c", 600: "#e08a86", 700: "#c77370",
          800: "#a85d5a", 900: "#803f3d", 950: "#5a2c2a",
        },
      },
      borderRadius: {
        sm: "6px", // form fields (squarer)
        md: "8px", // utility buttons
        lg: "12px", // cards
        xl: "16px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        "k-1": "0 0.5px 1px rgba(7,81,2,0.04), 0 1px 3px rgba(7,81,2,0.05), 0 4px 12px rgba(7,81,2,0.05)",
        "k-2": "0 1px 2px rgba(7,81,2,0.05), 0 6px 16px rgba(7,81,2,0.07), 0 12px 32px rgba(7,81,2,0.08)",
        "k-3": "0 2px 6px rgba(7,81,2,0.06), 0 14px 36px rgba(7,81,2,0.10), 0 28px 64px rgba(7,81,2,0.12)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
