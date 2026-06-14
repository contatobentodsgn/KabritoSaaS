import { requireActiveSubscription } from "@/server/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { AdaptForm } from "@/components/forms/adapt-form";

export const metadata = { title: "Adaptar ao meu nicho · Inteligência Criativa" };

export default async function AdaptarPage() {
  await requireActiveSubscription();
  return (
    <>
      <PageHeader
        eyebrow="Sob demanda"
        title="Adaptar ao meu nicho"
        description="Pegue uma pauta ou headline e deixe a IA reescrever para o seu público — com a sua linguagem."
      />
      <AdaptForm />
    </>
  );
}
