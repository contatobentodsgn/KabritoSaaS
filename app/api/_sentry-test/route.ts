import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * ENDPOINT TEMPORÁRIO de verificação do Sentry. Dispara um erro de propósito
 * (só com ?run=1, para bots/prefetch não acionarem). Serve para confirmar a
 * captura em produção e DEVE ser removido depois do teste.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get("run") !== "1") {
    return NextResponse.json({
      hint: "adicione ?run=1 para disparar um erro de teste do Sentry",
    });
  }
  const err = new Error("Sentry test error (intencional) — pode ignorar/remover");
  Sentry.captureException(err, { tags: { area: "sentry-test" } });
  // Serverless pode encerrar antes do envio assíncrono — força o flush.
  await Sentry.flush(2000);
  return NextResponse.json({ ok: true, sent: true });
}
