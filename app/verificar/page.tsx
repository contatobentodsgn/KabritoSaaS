import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getMfaStatus } from "@/server/auth/mfa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaVerifyForm } from "@/components/forms/mfa-verify-form";
import { LOGIN_ROUTE, DEFAULT_REDIRECT } from "@/lib/constants";

export const metadata = { title: "Verificação em duas etapas · Kabrito" };

/**
 * Passo de verificação TOTP no login. Top-level (fora de (auth)/(dashboard)): o
 * usuário chega aqui em aal1 com 2FA ativo, encaminhado pelo gate dos layouts.
 */
export default async function VerificarPage() {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_ROUTE);

  const mfa = await getMfaStatus();
  // Sem fator pendente (não ativou, ou já está em aal2) → nada a verificar.
  if (!mfa.factorId || !mfa.pendingAal2) redirect(DEFAULT_REDIRECT);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-k-1">
          <CardHeader className="space-y-3">
            <span className="k-eyebrow">Segurança</span>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">
                Verificação em duas etapas
              </CardTitle>
              <CardDescription>
                Digite o código de 6 dígitos do seu app autenticador para
                continuar.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <MfaVerifyForm factorId={mfa.factorId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
