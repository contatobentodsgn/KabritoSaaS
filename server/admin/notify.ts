import "server-only";
import { and, eq, gt, inArray, isNull, ne, or } from "drizzle-orm";
import { Resend } from "resend";
import { getServiceDbClient } from "@/server/db/service-client";
import {
  contentEditions,
  subscriptions,
  organizationMembers,
  profiles,
  editionComments,
} from "@/db/schema";
import { serverEnv } from "@/server/env";

/**
 * Escapa HTML antes de interpolar texto dinâmico (título/summary gerados por IA,
 * nome de quem convida, etc.) no corpo dos e-mails. Sem isso, markup vindo do
 * modelo ou de input do usuário seria injetado cru no HTML enviado aos assinantes.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Disparo do E-MAIL DIGEST na publicação (PROJECT_MASTER_DOCUMENT §2 estágio 4).
 *
 * É um job de SISTEMA (fan-out para todos os assinantes ativos) → usa o
 * service-client (bypass RLS) ISOLADO em server/admin/. Invocado pela ação de
 * publicação (staff) e pelo cron. Falha de e-mail NUNCA quebra a publicação.
 */
export async function getActiveSubscriberEmails(): Promise<string[]> {
  const db = getServiceDbClient();
  const rows = await db
    .select({ email: profiles.email })
    .from(subscriptions)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, subscriptions.organizationId),
    )
    .innerJoin(profiles, eq(profiles.userId, organizationMembers.userId))
    .where(
      and(
        inArray(subscriptions.subscriptionStatus, ["active", "trialing"]),
        or(
          isNull(subscriptions.currentPeriodEnd),
          gt(subscriptions.currentPeriodEnd, new Date()),
        ),
        isNull(profiles.deletedAt),
      ),
    );
  return [...new Set(rows.map((r) => r.email).filter(Boolean))];
}

export interface DigestResult {
  sent: number;
  skipped?: string;
}

/**
 * Notifica os PARTICIPANTES da thread (quem já comentou na edição, exceto o
 * autor) sobre um novo comentário. Job de sistema (cross-user) → service-client
 * isolado. Best-effort, limitado a 20 destinatários, só com RESEND_API_KEY.
 */
export async function notifyCommentParticipants(
  editionId: string,
  authorUserId: string,
): Promise<{ notified: number }> {
  try {
    if (!serverEnv.RESEND_API_KEY) return { notified: 0 };
    const db = getServiceDbClient();
    const [edition] = await db
      .select({ title: contentEditions.title })
      .from(contentEditions)
      .where(eq(contentEditions.id, editionId))
      .limit(1);
    if (!edition) return { notified: 0 };

    const rows = await db
      .select({ email: profiles.email })
      .from(editionComments)
      .innerJoin(profiles, eq(profiles.userId, editionComments.userId))
      .where(
        and(
          eq(editionComments.editionId, editionId),
          ne(editionComments.userId, authorUserId),
          isNull(profiles.deletedAt),
        ),
      );
    const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))].slice(0, 20);
    if (emails.length === 0) return { notified: 0 };

    const resend = new Resend(serverEnv.RESEND_API_KEY);
    const url = `${serverEnv.APP_URL}/daily-briefing`;
    let notified = 0;
    for (const to of emails) {
      try {
        await resend.emails.send({
          from: serverEnv.EMAIL_FROM,
          to,
          subject: `Novo comentário em ${edition.title}`,
          html: `
            <p>Há um novo comentário na edição "<strong>${escapeHtml(edition.title)}</strong>".</p>
            <p><a href="${url}">Ver a conversa →</a></p>
            <hr/>
            <p style="color:#888;font-size:12px">Você recebe porque participou desta conversa.</p>
          `,
        });
        notified++;
      } catch (err) {
        console.error("[comment-notify] envio:", err);
      }
    }
    return { notified };
  } catch (err) {
    console.error("[comment-notify]:", err);
    return { notified: 0 };
  }
}

/**
 * Convite por e-mail (workspace de agência). Best-effort: se não houver
 * RESEND_API_KEY, o convite pendente já existe no banco e a pessoa entra ao se
 * cadastrar com este e-mail (auto-aceite) — o e-mail é só a conveniência.
 */
export async function sendInviteEmail(params: {
  to: string;
  orgName: string;
  inviterName?: string | null;
  token?: string;
}): Promise<{ sent: boolean }> {
  try {
    if (!serverEnv.RESEND_API_KEY) return { sent: false };
    const resend = new Resend(serverEnv.RESEND_API_KEY);
    // Link de aceite por token; se a pessoa não tiver conta, é mandada ao login
    // (com retorno) e entra ao concluir o cadastro/login.
    const url = params.token
      ? `${serverEnv.APP_URL}/convite/${params.token}`
      : `${serverEnv.APP_URL}/register`;
    const who = params.inviterName
      ? `${escapeHtml(params.inviterName)} convidou você`
      : "Você foi convidado(a)";
    await resend.emails.send({
      from: serverEnv.EMAIL_FROM,
      to: params.to,
      subject: `Convite para ${params.orgName} no Kabrito`,
      html: `
        <h2>${who} para ${escapeHtml(params.orgName)}</h2>
        <p>Aceite o convite para entrar na equipe. Se ainda não tiver conta, crie uma com este e-mail.</p>
        <p><a href="${url}">Aceitar convite →</a></p>
        <hr/>
        <p style="color:#888;font-size:12px">Se não esperava este convite, ignore este e-mail.</p>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("[invite] falha ao enviar e-mail:", err);
    return { sent: false };
  }
}

export async function sendEditionDigest(editionId: string): Promise<DigestResult> {
  try {
    const db = getServiceDbClient();
    const [edition] = await db
      .select({
        title: contentEditions.title,
        summary: contentEditions.summary,
        slug: contentEditions.slug,
      })
      .from(contentEditions)
      .where(eq(contentEditions.id, editionId))
      .limit(1);
    if (!edition) return { sent: 0, skipped: "edição não encontrada" };

    if (!serverEnv.RESEND_API_KEY) {
      console.warn("[digest] RESEND_API_KEY ausente — pulando envio real.");
      return { sent: 0, skipped: "sem RESEND_API_KEY" };
    }

    const recipients = await getActiveSubscriberEmails();
    if (recipients.length === 0) return { sent: 0, skipped: "sem assinantes ativos" };

    const resend = new Resend(serverEnv.RESEND_API_KEY);
    const url = `${serverEnv.APP_URL}/daily-briefing`;
    const html = `
      <h2>${escapeHtml(edition.title)}</h2>
      <p>${escapeHtml(edition.summary ?? "Sua edição diária de inteligência criativa está pronta.")}</p>
      <p><a href="${url}">Abrir a edição de hoje →</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">Você recebe este e-mail porque tem assinatura ativa.</p>
    `;

    let sent = 0;
    for (const to of recipients) {
      try {
        await resend.emails.send({
          from: serverEnv.EMAIL_FROM,
          to,
          subject: edition.title,
          html,
        });
        sent++;
      } catch (err) {
        console.error("[digest] falha ao enviar para", to, err);
      }
    }
    return { sent };
  } catch (err) {
    console.error("[digest] erro geral:", err);
    return { sent: 0, skipped: "erro" };
  }
}
