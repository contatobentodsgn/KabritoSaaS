"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag, LayoutGrid, SlidersHorizontal } from "lucide-react";

type Niche = { slug: string; name: string };

/** Formatos filtráveis — espelham TODOS os valores do enum contentFormat do
 *  pipeline (generation-schemas), pra nenhum item gerado ficar não-filtrável. */
const FORMATS: { value: string; label: string }[] = [
  { value: "carrossel", label: "Carrossel" },
  { value: "reels", label: "Reels" },
  { value: "post_unico", label: "Post único" },
  { value: "thread", label: "Thread" },
  { value: "post_linkedin", label: "Post LinkedIn" },
  { value: "story", label: "Story" },
  { value: "sequencia_stories", label: "Sequência de stories" },
  { value: "roteiro_curto", label: "Roteiro curto" },
  { value: "post_opiniao", label: "Post de opinião" },
  { value: "post_educativo", label: "Post educativo" },
  { value: "post_venda", label: "Post de venda" },
];

const chip =
  "inline-flex items-center gap-2 rounded-full border border-mint-200 bg-card px-3 py-1.5 text-sm text-foreground";
const selectCls =
  "bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer";

/**
 * Filtros de conteúdo por Nicho e Formato, guardados na URL (?nicho=&formato=).
 * No dashboard funciona como "lente" (os atalhos carregam a seleção); em /trends
 * e /headlines a página lê os params e filtra a lista. Preserva os demais params.
 */
export function ContentFilters({
  niches,
  showFormat = false,
}: {
  niches: Niche[];
  showFormat?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nicho = searchParams.get("nicho") ?? "";
  const formato = searchParams.get("formato") ?? "";

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setParam = (key: string, value: string) =>
    push((p) => (value ? p.set(key, value) : p.delete(key)));

  const clear = () =>
    push((p) => {
      p.delete("nicho");
      p.delete("formato");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className={chip}>
        <Tag className="size-4 text-mint-700" strokeWidth={1.75} />
        <span className="text-muted-foreground">Nicho:</span>
        <select
          className={selectCls}
          value={nicho}
          onChange={(e) => setParam("nicho", e.target.value)}
          aria-label="Filtrar por nicho"
        >
          <option value="">Todos</option>
          {niches.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </select>
      </label>

      {showFormat && (
        <label className={chip}>
          <LayoutGrid className="size-4 text-mint-700" strokeWidth={1.75} />
          <span className="text-muted-foreground">Formato:</span>
          <select
            className={selectCls}
            value={formato}
            onChange={(e) => setParam("formato", e.target.value)}
            aria-label="Filtrar por formato"
          >
            <option value="">Todos</option>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {(nicho || formato) && (
        <button
          type="button"
          onClick={clear}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
