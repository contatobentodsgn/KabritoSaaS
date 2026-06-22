import { ImageResponse } from "next/og";

// Card de compartilhamento (WhatsApp/LinkedIn/X/Insta) — gerado on-brand, sem
// asset externo. O Next liga este arquivo automaticamente a openGraph.images +
// twitter.images de TODAS as rotas (com fallback por página se quiserem outra).
export const runtime = "edge";
export const alt = "Inteligência Criativa · Kabrito";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `<svg width="96" height="96" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" rx="12" fill="#075102"/><g transform="translate(6 5)"><path d="M30 3C16 5 6 13 4 26c-1 6 2 11 7 14C9 27 18 15 30 8c-8 8-12 16-13 27 11 1 21-6 24-16 3-9 0-19-11-16Z" fill="#EBF2EB"/><path d="M9 38C12 26 20 16 29 8" stroke="#FFACA8" stroke-width="2" stroke-linecap="round" fill="none"/></g></svg>`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#EBF2EB",
          padding: "76px 84px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img width={96} height={96} src={`data:image/svg+xml,${encodeURIComponent(MARK)}`} alt="" />
          <span style={{ fontSize: 38, color: "#075102", fontWeight: 700 }}>Kabrito</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 34, color: "#3e783a", letterSpacing: 2 }}>
            INTELIGÊNCIA CRIATIVA DIÁRIA
          </span>
          <span
            style={{
              fontSize: 82,
              color: "#0b3d0b",
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 14,
              maxWidth: 940,
            }}
          >
            Conteúdo que cuida, com respiro.
          </span>
        </div>

        <span style={{ fontSize: 28, color: "#598b56", maxWidth: 980 }}>
          Pautas, copy, headlines e prompts — gerados por IA, revisados por humanos antes de publicar.
        </span>
      </div>
    ),
    { ...size },
  );
}
