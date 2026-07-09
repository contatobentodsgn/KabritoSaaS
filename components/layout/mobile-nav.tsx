"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Navegação mobile (< md): gatilho hambúrguer no header que abre a Sidebar num
 * drawer deslizante. Dep-free — estado React + overlay; fecha no ESC, no clique
 * fora e ao navegar; trava o scroll do body enquanto aberto e devolve o foco ao
 * gatilho ao fechar. Acima de md fica oculto (md:hidden) — o aside fixo assume.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fecha ao trocar de rota (clique num link da Sidebar).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Enquanto aberto: ESC fecha, trava o scroll do body e foca o painel; ao
  // desmontar (fechar) devolve o foco ao gatilho.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-mint-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-forest-900 md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 animate-in fade-in"
            aria-hidden
          />
          {/* Painel deslizante com a Sidebar */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-mint-50 shadow-xl outline-none animate-in slide-in-from-left duration-200 dark:bg-forest-950"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <img
                src="/brand/logo-kabrito.svg"
                alt="Kabrito"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/brand/logo-kabrito-inverse.svg"
                alt="Kabrito"
                className="hidden h-7 w-auto dark:block"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-mint-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-forest-900"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
