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
import { GlossaryTerm } from "@/components/ui/glossary-term";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/daily-briefing",
    label: "Edição diária",
    icon: Newspaper,
    hint: "Edição = o pacote de conteúdo gerado pra você num dia: pautas, headlines e sugestões, revisados por humanos antes de chegar até você.",
  },
  {
    href: "/trends",
    label: "Pautas quentes",
    icon: TrendingUp,
    hint: "Pauta = uma tendência ou ideia de conteúdo que a IA encontrou, com o porquê ela importa e como adaptar pro seu nicho.",
  },
  { href: "/headlines", label: "Headlines", icon: Type },
  { href: "/prompts", label: "Prompts", icon: Sparkles },
  { href: "/adaptar", label: "Adaptar ao meu nicho", icon: Wand2 },
  { href: "/calendario", label: "Calendário editorial", icon: CalendarRange },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/settings/equipe", label: "Equipe", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const itemBase =
  "flex items-center gap-3 rounded-md px-3 py-2 text-[14.5px] k-transition k-focus";
const itemActive =
  "bg-forest-100 font-semibold text-forest-700 dark:bg-forest-800 dark:text-forest-100";
const itemIdle =
  "font-medium text-muted-foreground hover:bg-mint-100 hover:text-foreground dark:hover:bg-forest-800";

/**
 * Lista de navegação da Sidebar — extraída num client leaf porque só ela
 * precisa de usePathname (destaque do item ativo). A Sidebar em si (moldura +
 * bloco de conta) é Server Component; ver PERF-5.
 */
export function SidebarNav({ isStaff = false }: { isStaff?: boolean }) {
  const path = usePathname();
  // Match de prefixo mais longo: /settings/equipe vence /settings.
  const activeHref = NAV.reduce<string | null>((best, n) => {
    const match = path === n.href || path.startsWith(`${n.href}/`);
    return match && n.href.length > (best?.length ?? 0) ? n.href : best;
  }, null);
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon, hint }) => {
        const active = href === activeHref;
        return (
          // Wrapper à parte do <Link> (em vez de aninhar o gatilho do
          // glossário dentro dele): <button> dentro de <a> é HTML inválido e
          // atrapalha a navegação por teclado.
          <div key={href} className="flex items-center">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(itemBase, "flex-1", active ? itemActive : itemIdle)}
            >
              <Icon className="size-[19px]" />
              {label}
            </Link>
            {hint && (
              <GlossaryTerm
                term={label}
                definition={hint}
                className="mr-2 shrink-0"
              />
            )}
          </div>
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
  );
}
