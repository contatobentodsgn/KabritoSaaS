import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isCronAuthorized } from "@/server/pipeline/cron";
import { runLifecycle } from "@/server/pipeline/lifecycle";

/**
 * Cron de ciclo de vida: aplica retenção (arquiva/expira) e limpa raw_signals.
 * Protegido por CRON_SECRET (401 sem ele). (SECURITY_GUIDE §9)
 */
// Trava runtime Node: importa postgres/drizzle (server-only) via lifecycle.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runLifecycle();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/lifecycle] erro:", message);
    Sentry.captureException(err, { tags: { area: "cron", job: "lifecycle" } });
    // Não vaza o detalhe interno no corpo HTTP — fica em log/Sentry.
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
