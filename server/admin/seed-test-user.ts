/**
 * Cria (idempotente) um USUÁRIO DE TESTE pronto para login: confirma o e-mail,
 * provisiona profile+org+assinatura, marca superadmin e concede acesso ativo.
 *
 * EXIGE um Supabase REAL conectado no .env.local (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL). Contra placeholders, falha — não
 * existe servidor de Auth para criar a credencial.
 *
 * Uso: npm run seed:test-user                 # admin@kabrito.test / Kabrito!2026
 *      npm run seed:test-user -- email senha
 */
import "server-only";
import { createAdminSupabase } from "@/server/admin/supabase-admin";
import { provisionNewUser } from "@/server/admin/provisioning";
import { setStaffRole } from "@/server/admin/staff";
import { grantAccessByEmail } from "@/server/admin/billing";

const EMAIL = process.argv[2] ?? "admin@kabrito.test";
const PASSWORD = process.argv[3] ?? "Kabrito!2026";
const NAME = "Admin Teste";

async function main() {
  const admin = createAdminSupabase();

  let userId: string;
  const created = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: NAME },
  });

  if (created.error) {
    // Já existe? Localiza e redefine a senha para a conhecida.
    const list = await admin.auth.admin.listUsers();
    const existing = list.data.users.find((u) => u.email === EMAIL);
    if (!existing) throw created.error;
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
    });
  } else {
    userId = created.data.user!.id;
  }

  await provisionNewUser({ userId, email: EMAIL, name: NAME });
  await setStaffRole(EMAIL, "superadmin");
  await grantAccessByEmail(EMAIL, 365);

  console.log("\n✅ Usuário de teste pronto:");
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Senha: ${PASSWORD}`);
  console.log("   Papel: superadmin (acessa /admin) · assinatura: ativa\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Falha ao criar usuário de teste:", err?.message ?? err);
  console.error(
    "\nVerifique se .env.local aponta para um Supabase REAL (URL + service_role + DATABASE_URL).",
  );
  process.exit(1);
});
