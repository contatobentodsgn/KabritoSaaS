import Link from "next/link";
import { getCurrentProfile, getCurrentOrganization } from "@/server/auth/session";
import { getMfaStatus } from "@/server/auth/mfa";
import { getCurrentSubscription, hasActiveSubscription } from "@/server/permissions";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteAccount } from "@/components/forms/delete-account";
import { DataExport } from "@/components/forms/data-export";
import { SignOutAll } from "@/components/forms/sign-out-all";
import { MfaSettings } from "@/components/forms/mfa-settings";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { SubscribeOptions } from "@/components/forms/checkout-button";
import { STRIPE_ENABLED } from "@/server/admin/stripe";

export const metadata = { title: "Configurações · Inteligência Criativa" };

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string; billing?: string }>;
}) {
  const { inactive, billing } = await searchParams;
  const [profile, org, sub, active, mfa] = await Promise.all([
    getCurrentProfile(),
    getCurrentOrganization(),
    getCurrentSubscription(),
    hasActiveSubscription(),
    getMfaStatus(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Sua conta"
        title="Configurações"
        description="Sua conta e assinatura, em um só lugar."
      />

      {inactive && !active && (
        <Card className="mb-8 border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15">
          <CardContent className="py-4 text-sm text-rose-900 dark:text-blush-200">
            Sua assinatura não está ativa. O conteúdo editorial fica disponível
            apenas com a assinatura ativa.
          </CardContent>
        </Card>
      )}

      {billing === "ok" && (
        <Card className="mb-8 border-forest-200 dark:border-forest-700 bg-forest-50 dark:bg-forest-900">
          <CardContent className="py-4 text-sm text-forest-900 dark:text-forest-100">
            Pagamento recebido. A assinatura é ativada assim que o Stripe
            confirma — atualize a página em instantes se ainda aparecer pendente.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <AvatarUpload currentUrl={profile?.avatarUrl} name={profile?.name} />
            <div className="space-y-1">
              <p>Nome: {profile?.name ?? "—"}</p>
              <p>E-mail: {profile?.email ?? "—"}</p>
              <p>Workspace: {org?.name ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assinatura — Plano Único</CardTitle>
            <Badge variant={active ? "success" : "secondary"}>
              {sub ? (STATUS_LABEL[sub.subscriptionStatus] ?? sub.subscriptionStatus) : "Sem assinatura"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Plano único: acesso total enquanto a assinatura estiver ativa
              (sem níveis). Cobrança mensal ou anual.
            </p>
            {sub?.currentPeriodEnd && (
              <p>
                Período atual até:{" "}
                {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
            {STRIPE_ENABLED ? (
              !active && <SubscribeOptions />
            ) : (
              <p className="pt-2 text-xs">
                Cobrança via Stripe entra no MVP 3. No momento, o acesso é
                concedido manualmente pela equipe.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessões e segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Verificação em duas etapas (2FA)</p>
              <MfaSettings enrolled={mfa.enrolled} factorId={mfa.factorId} />
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="font-medium text-foreground">Dispositivos</p>
              <p>
                Seu acesso é limitado a poucos dispositivos ativos — ao entrar num
                aparelho novo além do limite, o mais antigo é desconectado.
              </p>
              <SignOutAll />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacidade e dados (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex gap-4">
              <Link href="/privacy" className="text-primary hover:underline">
                Política de privacidade
              </Link>
              <Link href="/termos" className="text-primary hover:underline">
                Termos de uso
              </Link>
            </p>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="font-medium text-foreground">Baixar meus dados</p>
              <p>Exporte seus dados pessoais (perfil, favoritos, comentários, sessões) em JSON.</p>
              <DataExport />
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="font-medium text-foreground">Excluir conta e dados</p>
              <DeleteAccount />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
