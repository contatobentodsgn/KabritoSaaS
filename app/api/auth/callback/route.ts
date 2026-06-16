import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordLogin } from "@/server/services/session";
import { DEFAULT_REDIRECT } from "@/lib/constants";

// recordLogin usa node:crypto → runtime Node (nunca Edge).
export const runtime = "nodejs";

/**
 * Só permite redirecionar para um caminho INTERNO relativo: precisa começar com
 * uma única "/" (não "//" nem "/\"), evitando open-redirect e o bypass via "@"
 * (ex.: redirectTo=@evil.com → https://app@evil.com). Caso contrário, fallback.
 */
function safeNextPath(raw: string | null): string {
  if (raw && /^\/(?![/\\])/.test(raw)) return raw;
  return DEFAULT_REDIRECT;
}

/**
 * Callback de confirmação de e-mail / OAuth / magic-link do Supabase. Troca o
 * `code` por uma sessão e redireciona. (Padrão @supabase/ssr.)
 *
 * IMPORTANTE: este é um caminho de login PRIMÁRIO (confirmação de e-mail, OAuth,
 * magic-link). Precisa chamar recordLogin igual ao login por senha — senão a
 * sessão nasce sem linha em user_sessions/access_logs e escapa do limite de
 * dispositivos e da revogação (o middleware só consegue bloquear sessões que têm
 * cookie de device + linha). Também barra reentrada de conta excluída (LGPD).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("redirectTo"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Conta excluída (soft-delete) não pode reentrar via confirmação/OAuth.
        const { data: prof } = await supabase
          .from("profiles")
          .select("deleted_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (prof?.deleted_at) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=account_deleted`);
        }
        await recordLogin(user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
