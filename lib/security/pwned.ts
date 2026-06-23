import "server-only";
import { createHash } from "node:crypto";

/**
 * Proteção contra senha vazada via HaveIBeenPwned (Pwned Passwords range API),
 * usando k-anonymity: envia só os 5 primeiros caracteres do hash SHA-1 — a
 * senha NUNCA sai do servidor. Grátis, sem API key, server-side (não afeta a
 * CSP). FAIL-OPEN: se a HIBP estiver indisponível, não bloqueia o cadastro.
 *
 * Alternativa gratuita ao "leaked password protection" do Supabase (que é Pro).
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Add-Padding esconde a contagem real de sufixos (privacidade extra).
      headers: { "Add-Padding": "true", "User-Agent": "Kabrito" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false; // fail-open

    const body = await res.text();
    for (const line of body.split("\n")) {
      const sep = line.indexOf(":");
      if (sep === -1) continue;
      if (line.slice(0, sep).trim().toUpperCase() === suffix) {
        const count = Number.parseInt(line.slice(sep + 1), 10) || 0;
        return count > 0; // com padding, entradas falsas vêm com count 0
      }
    }
    return false;
  } catch {
    return false; // timeout / rede indisponível → não bloqueia
  }
}
