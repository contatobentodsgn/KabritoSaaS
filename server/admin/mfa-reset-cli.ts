/**
 * CLI anti-lockout do 2FA: remove os fatores MFA de uma conta que perdeu o
 * autenticador (Supabase TOTP não tem recovery codes nativos).
 * Uso: npm run mfa:reset -- usuario@email.com
 */
import "server-only";
import { resetUserMfa } from "@/server/admin/supabase-admin";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npm run mfa:reset -- usuario@email.com");
    process.exit(1);
  }
  const res = await resetUserMfa(email);
  console.log(res.message);
  process.exit(res.ok ? 0 : 1);
}

main();
