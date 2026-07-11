import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth, getCurrentProfile } from "@/server/auth/session";
import { getMfaStatus } from "@/server/auth/mfa";
import { MFA_ENFORCE } from "@/lib/security/mfa";
import { isStaff } from "@/server/permissions";
import { signOutAction } from "@/server/actions/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Layout autenticado. requireAuth() é a defesa de servidor (além do middleware).
 * SEM seletor de organização (restrição: multi-tenant latente/invisível no MVP).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  // 2FA (atrás do flag OFF): quem ativou precisa verificar no login (aal1→aal2).
  if (MFA_ENFORCE) {
    const mfa = await getMfaStatus();
    if (mfa.pendingAal2) redirect("/verificar");
  }
  const [profile, staff] = await Promise.all([getCurrentProfile(), isStaff()]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-mint-50 dark:bg-forest-950/40 md:flex">
        <div className="px-5 pb-3 pt-5">
          <Link href="/dashboard" aria-label="Kabrito">
            <Logo />
          </Link>
        </div>
        <Sidebar
          isStaff={staff}
          email={profile?.email ?? undefined}
          name={profile?.name ?? undefined}
          avatarUrl={profile?.avatarUrl ?? undefined}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Navegação mobile (< md): hambúrguer abre a Sidebar num drawer. */}
            <MobileNav>
              <Sidebar
                isStaff={staff}
                email={profile?.email ?? undefined}
                name={profile?.name ?? undefined}
                avatarUrl={profile?.avatarUrl ?? undefined}
              />
            </MobileNav>
            <Link
              href="/dashboard"
              className="min-w-0 truncate font-serif text-lg font-medium tracking-tight text-foreground sm:text-xl"
            >
              Inteligência Criativa
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm sm:gap-4">
            <span className="hidden text-muted-foreground sm:inline">
              {profile?.email}
            </span>
            <ThemeToggle />
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
