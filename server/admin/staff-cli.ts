/**
 * CLI para promover uma conta a staff. A conta precisa já existir (cadastro feito).
 * Uso: npm run staff -- usuario@email.com [superadmin|editor]
 */
import "server-only";
import { setStaffRole, type StaffRoleValue } from "@/server/admin/staff";

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] ?? "superadmin") as StaffRoleValue;
  if (!email) {
    console.error(
      "Uso: npm run staff -- usuario@email.com [superadmin|editor]",
    );
    process.exit(1);
  }
  if (role !== "superadmin" && role !== "editor" && role !== null) {
    console.error("Papel inválido. Use: superadmin | editor");
    process.exit(1);
  }
  const res = await setStaffRole(email, role);
  console.log(res.message);
  process.exit(res.ok ? 0 : 1);
}

main();
