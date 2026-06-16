import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  buildCsp,
  CSP_REQUEST_HEADER,
  CSP_RESPONSE_HEADER,
} from "@/lib/security/csp";
import {
  PROTECTED_ROUTES,
  STAFF_ROUTES,
  AUTH_ROUTES,
  DEFAULT_REDIRECT,
  LOGIN_ROUTE,
  DEVICE_COOKIE_NAME,
} from "@/lib/constants";

function matches(path: string, routes: readonly string[]) {
  return routes.some((r) => path === r || path.startsWith(`${r}/`));
}

/**
 * Proteção de rotas + redirects + gate de staff em /admin.
 * (TECHNICAL_SPEC §3) — autorização SEMPRE no servidor.
 */
export async function middleware(request: NextRequest) {
  // Nonce por requisição para a CSP. É propagado no header do request para o Next
  // aplicar aos seus scripts, e os Server Components o leem via headers()['x-nonce'].
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_REQUEST_HEADER, csp);

  const { response, user, supabase } = await updateSession(request, requestHeaders);
  // CSP na resposta. Enforcing ou Report-Only conforme CSP_ENFORCE (lib/security/csp.ts).
  response.headers.set(CSP_RESPONSE_HEADER, csp);
  const path = request.nextUrl.pathname;

  // Deslogado tentando rota privada → /login (com retorno).
  if (!user && matches(path, PROTECTED_ROUTES)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // Logado tentando /login ou /register → dashboard.
  if (user && AUTH_ROUTES.some((r) => path === r)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_REDIRECT;
    return NextResponse.redirect(url);
  }

  // Controle de sessão: se o dispositivo atual teve a sessão REVOGADA (excedeu
  // o limite de dispositivos), bloqueia e força relogin. (SECURITY_GUIDE §8)
  if (user && matches(path, PROTECTED_ROUTES)) {
    const deviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
    if (deviceId) {
      const { data: sess } = await supabase
        .from("user_sessions")
        .select("is_active")
        .eq("user_id", user.id)
        .eq("device_id", deviceId)
        .maybeSingle();
      if (sess && sess.is_active === false) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = LOGIN_ROUTE;
        url.searchParams.set("reason", "session_expired");
        return NextResponse.redirect(url);
      }
    }
  }

  // /admin exige staff (editor/superadmin). Defesa em profundidade: o layout
  // do /admin também chama requireStaff().
  if (user && matches(path, STAFF_ROUTES)) {
    const { data } = await supabase
      .from("profiles")
      .select("staff_role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data?.staff_role) {
      const url = request.nextUrl.clone();
      url.pathname = DEFAULT_REDIRECT;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas EXCETO:
     * - _next/static, _next/image, favicon, assets com extensão
     * - /api/cron/* (protegido por CRON_SECRET, não por sessão)
     * - /api/webhooks/* (autenticado por assinatura HMAC, server-to-server)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cron|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
