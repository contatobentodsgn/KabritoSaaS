import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetRequestForm } from "@/components/forms/reset-request-form";

export const metadata = {
  title: "Recuperar senha · Kabrito",
  description:
    "Solicite um e-mail para redefinir a senha da sua conta Kabrito.",
};

export default function RecuperarSenhaPage() {
  return (
    <Card className="shadow-k-1">
      <CardHeader className="space-y-3">
        <span className="k-eyebrow">Sem estresse</span>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ResetRequestForm />
      </CardContent>
    </Card>
  );
}
