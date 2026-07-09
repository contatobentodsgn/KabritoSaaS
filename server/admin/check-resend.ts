import { Resend } from "resend";

/**
 * Verifica o envio de e-mail transacional (Resend) usado por server/admin/notify.ts.
 *
 * Uso: `npm run check:resend -- destinatario@email.com`
 *      (lê RESEND_API_KEY/EMAIL_FROM do .env.local; também aceita CHECK_EMAIL_TO)
 *
 * No MODO DE TESTE do Resend (from onboarding@resend.dev, sem domínio verificado),
 * o destinatário PRECISA ser o e-mail da sua conta Resend — senão o Resend recusa.
 * Não imprime segredos. Sai com código 1 em qualquer falha.
 */
async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "Kabrito <onboarding@resend.dev>";
  const to = process.argv[2]?.trim() ?? process.env.CHECK_EMAIL_TO?.trim();

  console.log("RESEND_API_KEY presente:", !!apiKey);
  console.log("EMAIL_FROM:", from);
  console.log("destinatário:", to ?? "(não informado)");

  if (!apiKey) {
    console.error(
      "❌ RESEND_API_KEY ausente — e-mails do app ficam desativados (best-effort).",
    );
    process.exit(1);
  }
  if (!to) {
    console.error(
      "ℹ️  Informe o destinatário: npm run check:resend -- voce@email.com",
    );
    console.error(
      "    (no modo de teste do Resend, use o e-mail da SUA conta Resend.)",
    );
    process.exit(1);
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Teste de e-mail — Kabrito",
      html: "<p>✅ Se você recebeu este e-mail, o Resend está configurado e funcionando.</p>",
    });
    if (error) {
      console.error("❌ Resend recusou o envio:", error.message);
      console.error(
        "   (token errado, remetente não verificado, ou destinatário não permitido no modo de teste.)",
      );
      process.exit(1);
    }
    console.log("✅ Enviado! id:", data?.id);
    console.log(
      "   Confira a caixa de entrada do destinatário e o log em resend.com → Emails.",
    );
  } catch (err) {
    console.error(
      "❌ Falha ao enviar:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }
}

void main();
