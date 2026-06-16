import { NextResponse } from "next/server";

// Recebe os relatórios de violação da CSP (report-uri). Em Report-Only, é aqui
// que descobrimos o que precisaria ser liberado antes de promover para enforcing.
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // O payload vem como { "csp-report": {...} } (report-uri) ou array (report-to).
    const report = (body && (body["csp-report"] ?? body)) as Record<string, unknown>;
    console.warn("[csp-report]", JSON.stringify(report));
  } catch {
    // Corpo inválido/ausente — ignora.
  }
  return new NextResponse(null, { status: 204 });
}
