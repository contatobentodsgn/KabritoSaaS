import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewPasswordForm } from "@/components/forms/new-password-form";

export const metadata = { title: "Redefinir senha · Kabrito" };

/**
 * Top-level (fora de (auth)/(dashboard)): o usuário chega aqui autenticado via o
 * link do e-mail (callback trocou o code por sessão de recuperação). Sem sessão =
 * link inválido/expirado → volta para pedir um novo.
 */
export default async function RedefinirSenhaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/recuperar-senha?expired=1");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        aria-label="Kabrito — página inicial"
        className="mb-10 inline-flex rounded-sm transition-opacity duration-150 hover:opacity-80"
      >
        <img src="/brand/logo-kabrito.svg" alt="Kabrito" className="h-8 w-auto" />
      </Link>
      <div className="w-full max-w-md">
        <Card className="shadow-k-1">
          <CardHeader className="space-y-3">
            <span className="k-eyebrow">Quase lá</span>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">Definir nova senha</CardTitle>
              <CardDescription>Escolha uma nova senha para a sua conta.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <NewPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
