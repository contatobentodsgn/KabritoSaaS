import Link from "next/link";
import { requireAuth, getCurrentProfile } from "@/server/auth/session";
import { isStaff } from "@/server/permissions";
import { signOutAction } from "@/server/actions/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

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
  const [profile, staff] = await Promise.all([getCurrentProfile(), isStaff()]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-mint-50 md:flex">
        <div className="px-5 pb-3 pt-5">
          <Link href="/dashboard" aria-label="Kabrito">
            <img
              src="/brand/logo-kabrito.svg"
              alt="Kabrito"
              className="h-7 w-auto"
            />
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
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <Link
            href="/dashboard"
            className="font-serif text-xl font-medium tracking-tight text-foreground"
          >
            Inteligência Criativa
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {profile?.email}
            </span>
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
