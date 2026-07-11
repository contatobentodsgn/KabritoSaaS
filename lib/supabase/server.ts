import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Cliente Supabase para o SERVIDOR (Server Components / Server Actions / Route
 * Handlers) ligado aos cookies da requisição → carrega o JWT do usuário.
 *
 * ⚠️ Use SEMPRE este cliente para queries originadas por requisição de usuário
 * final. Ele respeita a RLS. NUNCA use o service-client para dados de usuário.
 * (PROJECT_MASTER_DOCUMENT §4 / SECURITY_GUIDE §3)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.SUPABASE_URL,
    publicEnv.SUPABASE_ANON_KEY,
    {
      // Garante o atributo Secure em produção (o default do @supabase/ssr não o seta).
      // httpOnly fica false por necessidade do client browser; a CSP é a contrapartida.
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` chamado de um Server Component — ignorável quando há
            // middleware atualizando a sessão. (Padrão recomendado @supabase/ssr)
          }
        },
      },
    },
  );
}
