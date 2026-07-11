import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/server/audit/log";
import { AUDIT_ACTIONS, DEVICE_COOKIE_NAME } from "@/lib/constants";
import { getClientMeta } from "@/lib/request";
import { DEFAULT_DEVICE_LIMIT } from "@/lib/config";
import { serverEnv } from "@/server/env";
import { pickSessionsToRevoke } from "@/server/services/device-limit";
import { acceptPendingInvites } from "@/server/admin/team";

/**
 * Controle de SESSÃO por LIMITE DE DISPOSITIVOS (PROJECT §11, SECURITY_GUIDE §8).
 * Combina device_id (cookie httpOnly) + user_agent + last_seen_at +
 * session_token_hash. Tudo via cliente de usuário (RLS: user_sessions próprios).
 * Login no dispositivo N+1 revoga o mais antigo. Cada login/revogação → access_logs.
 */
export const DEVICE_COOKIE = DEVICE_COOKIE_NAME;

export async function getOrCreateDeviceId(): Promise<string> {
  const store = await cookies();
  let id = store.get(DEVICE_COOKIE)?.value;
  if (!id) {
    id = randomUUID();
    store.set(DEVICE_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}

const hashToken = (s: string) => createHash("sha256").update(s).digest("hex");

async function enforceDeviceLimit(
  userId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const limit =
    serverEnv.DEVICE_LIMIT > 0 ? serverEnv.DEVICE_LIMIT : DEFAULT_DEVICE_LIMIT;
  const { data: active } = await supabase
    .from("user_sessions")
    .select("id, last_seen_at")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (!active) return;

  // Decide quais revogar com a lógica pura (testável) e aplica.
  const toRevoke = pickSessionsToRevoke(
    active.map((s) => ({
      id: s.id as string,
      lastSeenAt: s.last_seen_at as string | null,
    })),
    limit,
  );
  for (const id of toRevoke) {
    await supabase
      .from("user_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("access_logs").insert({
      user_id: userId,
      action: AUDIT_ACTIONS.SESSION_REVOKED,
    });
    await recordAudit({
      action: AUDIT_ACTIONS.SESSION_REVOKED,
      entityType: "user_session",
      entityId: id,
    });
  }
}

export async function recordLogin(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const deviceId = await getOrCreateDeviceId();
    const { userAgent, ip } = await getClientMeta();
    const tokenHash = hashToken(`${userId}:${deviceId}`);

    const { data: existing } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle();

    let isNewDevice = false;
    if (existing) {
      await supabase
        .from("user_sessions")
        .update({
          is_active: true,
          revoked_at: null,
          last_seen_at: new Date().toISOString(),
          user_agent: userAgent,
          ip_address: ip,
          session_token_hash: tokenHash,
        })
        .eq("id", existing.id);
    } else {
      isNewDevice = true;
      await supabase.from("user_sessions").insert({
        user_id: userId,
        device_id: deviceId,
        session_token_hash: tokenHash,
        user_agent: userAgent,
        ip_address: ip,
        is_active: true,
      });
    }

    await supabase.from("access_logs").insert({
      user_id: userId,
      action: AUDIT_ACTIONS.LOGIN,
      ip_address: ip,
      user_agent: userAgent,
    });
    if (isNewDevice) {
      await recordAudit({
        action: AUDIT_ACTIONS.SESSION_NEW_DEVICE,
        entityType: "user_session",
        metadata: { deviceId },
      });
    }
    await enforceDeviceLimit(userId, supabase);
    // Aceita convites de equipe pendentes para este usuário (entrou depois do convite).
    await acceptPendingInvites(userId);
  } catch (err) {
    console.error("[session] recordLogin:", err);
  }
}

export async function recordLogout(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const store = await cookies();
    const deviceId = store.get(DEVICE_COOKIE)?.value;
    const { userAgent, ip } = await getClientMeta();
    if (deviceId) {
      await supabase
        .from("user_sessions")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    }
    await supabase.from("access_logs").insert({
      user_id: userId,
      action: AUDIT_ACTIONS.LOGOUT,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("[session] recordLogout:", err);
  }
}

/** Quantidade de dispositivos ativos do usuário está dentro do limite? */
export async function withinDeviceLimit(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const limit =
    serverEnv.DEVICE_LIMIT > 0 ? serverEnv.DEVICE_LIMIT : DEFAULT_DEVICE_LIMIT;
  const { count } = await supabase
    .from("user_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  return (count ?? 0) <= limit;
}
