"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Cliente Supabase para o BROWSER. Usa apenas chaves públicas (anon).
 * A RLS é aplicada porque as requisições carregam o JWT do usuário.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.SUPABASE_URL,
    publicEnv.SUPABASE_ANON_KEY,
  );
}
