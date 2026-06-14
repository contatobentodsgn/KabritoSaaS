"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCheckoutAction } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "annual";

/**
 * Botão "Assinar": dispara o Checkout do Stripe para o ciclo escolhido e
 * redireciona o navegador para a URL hospedada. Em erro, toast e fica na página.
 */
export function CheckoutButton({
  billingCycle,
}: {
  billingCycle: BillingCycle;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await createCheckoutAction(billingCycle);
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.error);
    } catch {
      toast.error("Não foi possível iniciar o checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="blush" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecionando…" : "Assinar"}
    </Button>
  );
}

/**
 * Bloco de assinatura: alterna entre cobrança mensal e anual e oferece o botão
 * de checkout para o ciclo selecionado. Usado na página de configurações quando
 * o billing está habilitado.
 */
export function SubscribeOptions({
  priceMonthly,
  priceAnnual,
}: {
  priceMonthly?: string | undefined;
  priceAnnual?: string | undefined;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="space-y-4 pt-2">
      <div
        role="radiogroup"
        aria-label="Ciclo de cobrança"
        className="inline-flex rounded-md border border-input bg-card p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
          className={
            cycle === "monthly"
              ? "rounded-[5px] bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              : "rounded-[5px] px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          }
        >
          Mensal{priceMonthly ? ` · R$ ${priceMonthly}` : ""}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={cycle === "annual"}
          onClick={() => setCycle("annual")}
          className={
            cycle === "annual"
              ? "rounded-[5px] bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              : "rounded-[5px] px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          }
        >
          Anual{priceAnnual ? ` · R$ ${priceAnnual}` : ""}
        </button>
      </div>

      <div>
        <CheckoutButton billingCycle={cycle} />
      </div>
    </div>
  );
}
