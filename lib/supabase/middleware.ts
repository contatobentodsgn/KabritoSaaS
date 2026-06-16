import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Atualiza a sessão Supabase (refresh de token) na borda, em cada request.
 * Retorna o usuário atual + a resposta com cookies atualizados.
 * Usado pelo middleware.ts para decidir redirects.
 */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  // requestHeaders carrega o x-nonce + CSP (para o Next aplicar o nonce aos scripts).
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    publicEnv.SUPABASE_URL,
    publicEnv.SUPABASE_ANON_KEY,
    {
      // Secure em produção (default do @supabase/ssr não inclui essa flag).
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rode lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
