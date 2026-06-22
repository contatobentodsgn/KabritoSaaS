"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Type,
  Sparkles,
  Heart,
  Wand2,
  CalendarRange,
  Users,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-briefing", label: "Edição diária", icon: Newspaper },
  { href: "/trends", label: "Pautas quentes", icon: TrendingUp },
  { href: "/headlines", label: "Headlines", icon: Type },
  { href: "/prompts", label: "Prompts", icon: Sparkles },
  { href: "/adaptar", label: "Adaptar ao meu nicho", icon: Wand2 },
  { href: "/calendario", label: "Calendário editorial", icon: CalendarRange },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/settings/equipe", label: "Equipe", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const itemBase =
  "flex items-center gap-3 rounded-md px-3 py-2 text-[14.5px] transition-colors duration-150";
const itemActive =
  "bg-forest-100 font-semibold text-forest-700 dark:bg-forest-800 dark:text-forest-100";
const itemIdle =
  "font-medium text-muted-foreground hover:bg-mint-100 hover:text-foreground dark:hover:bg-forest-800";

export function Sidebar({
  isStaff = false,
  email,
  name,
  avatarUrl,
}: {
  isStaff?: boolean;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const path = usePathname();
  // Match de prefixo mais longo: /settings/equipe vence /settings.
  const activeHref = NAV.reduce<string | null>((best, n) => {
    const match = path === n.href || path.startsWith(`${n.href}/`);
    return match && n.href.length > (best?.length ?? 0) ? n.href : best;
  }, null);
  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(itemBase, active ? itemActive : itemIdle)}
            >
              <Icon className="size-[19px]" />
              {label}
            </Link>
          );
        })}
        {isStaff && (
          <>
            <div className="my-2 border-t" />
            <Link
              href="/admin/review"
              aria-current={path.startsWith("/admin") ? "page" : undefined}
              className={cn(
                itemBase,
                path.startsWith("/admin") ? itemActive : itemIdle,
              )}
            >
              <Shield className="size-[19px]" />
              Admin
            </Link>
          </>
        )}
      </nav>
      <div className="flex items-center gap-3 border-t border-border p-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name ?? email ?? "Avatar"}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-semibold text-forest-700 dark:bg-forest-800 dark:text-forest-100">
            {(name?.[0] ?? email?.[0] ?? "K").toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-foreground">
            {name ?? email ?? "Sua conta"}
          </div>
          <div className="text-xs text-muted-foreground">Plano único</div>
        </div>
      </div>
    </div>
  );
}
