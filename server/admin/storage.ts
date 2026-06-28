import "server-only";
import { createAdminSupabase } from "@/server/admin/supabase-admin";
import { serverEnv } from "@/server/env";

/**
 * Upload de AVATAR (MVP 3+). Validação de MIME e tamanho (TECHNICAL_SPEC §11).
 * Sobe via service-role (isolado em server/admin) para um bucket público
 * "avatars" com caminho por usuário; nunca executa o arquivo. O `avatar_url`
 * resultante é salvo no profile (pela action, com RLS) e flui para a comunidade
 * via a view public_profiles.
 */
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Detecta o tipo real pela assinatura (magic bytes) — não confia no Content-Type
 * declarado pelo cliente (forjável). Retorna o MIME real ou null.
 */
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png"; // 89 50 4E 47
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg"; // FF D8 FF
  }
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // RIFF
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50 // WEBP
  ) {
    // Não basta o container RIFF/WEBP: valida o subchunk de imagem (VP8/VP8L/VP8X).
    const chunk = buf.toString("ascii", 12, 16);
    return chunk === "VP8 " || chunk === "VP8L" || chunk === "VP8X" ? "image/webp" : null;
  }
  return null;
}

export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Upload indisponível (Storage não configurado)." };
  }
  const ext = ALLOWED_EXT[file.type];
  if (!ext) return { ok: false, error: "Use uma imagem PNG, JPG ou WEBP." };
  if (file.size === 0) return { ok: false, error: "Arquivo vazio." };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "Imagem muito grande (máx. 2 MB)." };

  try {
    const admin = createAdminSupabase();
    const path = `${userId}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    // Confere os magic bytes contra o tipo declarado (anti-spoofing de MIME).
    if (sniffImageType(buffer) !== file.type) {
      return { ok: false, error: "Arquivo não é uma imagem PNG, JPG ou WEBP válida." };
    }
    const { error } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (error) {
      console.error("[avatar] upload:", error.message);
      return { ok: false, error: "Falha no upload da imagem." };
    }
    const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    // cache-bust: o caminho é estável (upsert), então versionamos a URL salva.
    return { ok: true, url: `${data.publicUrl}?v=${Date.now()}` };
  } catch (err) {
    console.error("[avatar] erro:", err);
    return { ok: false, error: "Falha no upload da imagem." };
  }
}
