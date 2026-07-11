import { headers } from "next/headers";

export interface ClientMeta {
  ip: string | null;
  userAgent: string | null;
}

/** IP/user-agent do request atual, lidos dos headers (proxy-aware). */
export async function getClientMeta(): Promise<ClientMeta> {
  const h = await headers();
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null,
    userAgent: h.get("user-agent"),
  };
}
