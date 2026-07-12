"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin/review", label: "Fila de revisão" },
  { href: "/admin/sources", label: "Fontes" },
  { href: "/admin/prompts", label: "Prompts & taxonomia" },
  { href: "/admin/runs", label: "Runs & custo" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/cards", label: "Cards do painel" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-3">
      {NAV.map(({ href, label }) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium k-transition k-focus",
              active
                ? "bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
