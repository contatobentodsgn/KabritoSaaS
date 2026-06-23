import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/server/permissions";
import { getMfaStatus } from "@/server/auth/mfa";
import { MFA_ENFORCE } from "@/lib/security/mfa";
import { signOutAction } from "@/server/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * /admin restrito a STAFF. requireStaff() é a defesa de servidor (além do
 * middleware que já bloqueia não-staff). (TECHNICAL_SPEC §3, SECURITY_GUIDE §7)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await requireStaff();
  // 2FA obrigatório para staff (atrás do flag OFF): sem fator → ativar; com
  // fator mas em aal1 → verificar. Hoje o flag está desligado (no-op).
  if (MFA_ENFORCE) {
    const mfa = await getMfaStatus();
    if (!mfa.enrolled) redirect("/settings?mfa=required");
    if (mfa.pendingAal2) redirect("/verificar");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/review"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <img
                src="/brand/logo-kabrito.svg"
                alt="Kabrito"
                className="h-6 w-auto"
              />
              <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
              <span className="k-eyebrow hidden sm:block">Inteligência criativa</span>
            </Link>
            <Badge variant="forest">{role}</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Voltar ao app
            </Link>
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        <AdminNav />
        {children}
      </main>
    </div>
  );
}
