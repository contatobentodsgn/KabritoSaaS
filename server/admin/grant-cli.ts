/**
 * CLI de concessão manual de acesso (MVP — sem Stripe).
 * Uso: npm run grant -- usuario@email.com [dias]
 */
import "server-only";
import { grantAccessByEmail } from "@/server/admin/billing";

async function main() {
  const email = process.argv[2];
  const days = Number(process.argv[3] ?? "365");
  if (!email) {
    console.error("Uso: npm run grant -- usuario@email.com [dias]");
    process.exit(1);
  }
  const res = await grantAccessByEmail(email, days);
  console.log(res.message);
  process.exit(res.ok ? 0 : 1);
}

main();
