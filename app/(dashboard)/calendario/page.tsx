import { requireActiveSubscription } from "@/server/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarForm } from "@/components/forms/calendar-form";

export const metadata = {
  title: "Calendário editorial · Inteligência Criativa",
};

export default async function CalendarioPage() {
  await requireActiveSubscription();
  return (
    <>
      <PageHeader
        eyebrow="Sob demanda"
        title="Calendário editorial"
        description="Informe seu nicho e objetivo, e a IA monta uma semana de conteúdo pronta para publicar."
      />
      <CalendarForm />
    </>
  );
}
