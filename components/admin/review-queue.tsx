"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { QueueEdition } from "@/server/services/admin";
import { EmptyState } from "@/components/content/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusMapEntry } from "@/components/ui/status-badge";

const REVIEW_STATUS: Record<string, StatusMapEntry> = {
  pending: { label: "Pendente", variant: "warning" },
  in_review: { label: "Em revisão", variant: "secondary" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

/** Filtro client-side leve sobre a lista já carregada (UX-8) — sem query nova. */
export function ReviewQueue({ editions }: { editions: QueueEdition[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return editions;
    return editions.filter(
      (e) => e.title.toLowerCase().includes(q) || e.edition_date.includes(q),
    );
  }, [editions, query]);

  return (
    <>
      {editions.length > 5 && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou data..."
          aria-label="Buscar na fila de revisão"
          className="mb-4"
        />
      )}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nada encontrado"
          description={
            query
              ? `Nenhuma edição corresponde a "${query}".`
              : "As edições geradas automaticamente aparecem aqui como rascunho, prontas para a sua leitura — nada é publicado sem a sua aprovação."
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/admin/review/${e.id}`}
              className="group block"
            >
              <Card className="transition-[border-color,box-shadow] duration-150 group-hover:border-rose-200 dark:group-hover:border-rose-500/40 group-hover:shadow-k-1">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg font-medium leading-tight">
                      {e.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {e.edition_date}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.counts.trends} pautas · {e.counts.headlines} headlines
                      · {e.counts.suggestions} sugestões
                    </p>
                  </div>
                  <StatusBadge status={e.review_status} map={REVIEW_STATUS} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
