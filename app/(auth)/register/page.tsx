import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata = { title: "Criar conta · Kabrito" };

export default function RegisterPage() {
  return (
    <Card className="shadow-k-1">
      <CardHeader className="space-y-3">
        <span className="k-eyebrow">Comece com calma</span>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            Comece a receber pautas, copy, headlines e prompts revisados.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
