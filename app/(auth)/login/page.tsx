import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export const metadata = { title: "Entrar · Kabrito" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const sessionExpired = params?.reason === "session_expired";

  return (
    <Card className="shadow-k-1">
      <CardHeader className="space-y-3">
        <span className="k-eyebrow">Bem-vinda de volta</span>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Acesse sua central diária de inteligência criativa.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <div
            role="status"
            className="mb-5 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            Sua sessão expirou com tranquilidade. Entre novamente para continuar.
          </div>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
