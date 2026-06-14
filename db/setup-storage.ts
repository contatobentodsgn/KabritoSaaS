/**
 * Cria (idempotente) o bucket público "avatars" no Supabase Storage.
 * Exige SUPABASE_SERVICE_ROLE_KEY + URL. Uso: npm run setup:storage
 */
import { createAdminSupabase } from "@/server/admin/supabase-admin";
import { AVATAR_BUCKET, MAX_AVATAR_BYTES } from "@/server/admin/storage";

const admin = createAdminSupabase();
const { error } = await admin.storage.createBucket(AVATAR_BUCKET, {
  public: true,
  fileSizeLimit: MAX_AVATAR_BYTES,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
});

if (error && !/exist/i.test(error.message)) {
  console.error("Falha ao criar bucket:", error.message);
  process.exit(1);
}
console.log(`Bucket "${AVATAR_BUCKET}" pronto (público).`);
process.exit(0);
