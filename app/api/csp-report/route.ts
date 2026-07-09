import { NextResponse } from "next/server";
import { consume } from "@/server/rate-limit";

// Recebe os relatórios de violação da CSP (report-uri). Em Report-Only, é aqui
// que descobrimos o que precisaria ser liberado antes de promover para enforcing.
export const runtime = "nodejs";

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (
    xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  );
}

export async function POST(request: Request) {
  // Endpoint público → rate-limit por IP (anti log-flooding / abuso de recurso).
  if (!(await consume("csp_report", clientIp(request))).success) {
    return new NextResponse(null, { status: 429 });
  }
  try {
    const body = await request.json();
    // O payload vem como { "csp-report": {...} } (report-uri) ou array (report-to).
    const report = (body && (body["csp-report"] ?? body)) as Record<
      string,
      unknown
    >;
    // Trunca o payload logado (evita inflar logs com corpos enormes).
    console.warn("[csp-report]", JSON.stringify(report).slice(0, 2000));
  } catch {
    // Corpo inválido/ausente — ignora.
  }
  return new NextResponse(null, { status: 204 });
}
