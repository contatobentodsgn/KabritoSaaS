import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

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

  return createServerClient(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY, {
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
  });
}
