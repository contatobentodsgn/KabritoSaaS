import { NextResponse } from "next/server";
import {
  STRIPE_ENABLED,
  verifyAndConstructEvent,
  handleStripeEvent,
} from "@/server/admin/stripe";

/**
 * Webhook do Stripe (billing real, MVP 3). Roda no runtime Node (precisa do
 * corpo cru para validar a assinatura HMAC). (SECURITY_GUIDE §8)
 *
 * Fluxo:
 *  1. Sem chaves → 503 (billing desligado).
 *  2. Lê o corpo CRU (req.text) e valida a assinatura — NUNCA processa sem isso.
 *  3. Aplica o evento (idempotente) e responde 200 { received: true }.
 *  Qualquer falha de validação/processamento → 400 (Stripe reentrega).
 */
export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  if (!STRIPE_ENABLED) {
    return NextResponse.json(
      { error: "stripe_disabled" },
      { status: 503 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = verifyAndConstructEvent(payload, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "assinatura inválida";
    return NextResponse.json(
      { error: "invalid_signature", message },
      { status: 400 },
    );
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha ao processar";
    return NextResponse.json(
      { error: "handler_error", message },
      { status: 400 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
