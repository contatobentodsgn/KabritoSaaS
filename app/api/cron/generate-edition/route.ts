import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  isCronAuthorized,
  generateForActivePlatforms,
  todayISODate,
} from "@/server/pipeline/cron";

/**
 * Endpoint de cron (Vercel Cron) — gera a edição diária (DRAFT) por plataforma.
 * Protegido por CRON_SECRET: sem ele → 401. (SECURITY_GUIDE §9)
 * Falha não publica: tudo nasce draft e exige aprovação humana.
 */
// Trava runtime Node: a rota importa postgres/drizzle (server-only) via pipeline;
// nunca pode cair no Edge. Defesa-em-profundidade contra regressão de default.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const date = todayISODate();
  try {
    const results = await generateForActivePlatforms(date);
    return NextResponse.json({ ok: true, date, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/generate-edition] erro:", message);
    Sentry.captureException(err, { tags: { area: "cron", job: "generate-edition" } });
    // Não vaza o detalhe interno no corpo HTTP — fica em log/Sentry.
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export const GET = handle; // Vercel Cron dispara via GET com Bearer CRON_SECRET
export const POST = handle;
