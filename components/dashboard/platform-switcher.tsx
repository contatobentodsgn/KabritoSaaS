"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type PlatformOption = { slug: string; name: string };

/**
 * Segmented control de marca para alternar a plataforma da edição
 * (Instagram, LinkedIn, Threads…). Mantém a mesma rota e preserva os
 * demais query params, trocando apenas ?platform=<slug>. Item ativo em forest.
 */
export function PlatformSwitcher({
  platforms,
  current,
}: {
  platforms: PlatformOption[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = useCallback(
    (slug: string) => {
      if (slug === current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("platform", slug);
      router.push(`${pathname}?${params.toString()}`);
    },
    [current, pathname, router, searchParams],
  );

  // Sem escolha possível com uma só plataforma.
  if (platforms.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Plataforma da edição"
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-mint-200 dark:border-forest-800 bg-card p-1"
    >
      {platforms.map(({ slug, name }) => {
        const active = slug === current;
        return (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(slug)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium k-transition k-focus",
              active
                ? "bg-forest-700 text-white"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
