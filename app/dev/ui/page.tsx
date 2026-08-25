import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { GlossaryTerm } from "@/components/ui/glossary-term";
import { EmptyState } from "@/components/content/empty-state";
import { ConfirmDialogDemo } from "./confirm-dialog-demo";

export const metadata = { title: "/dev/ui — Preview de componentes" };

/**
 * DX-9: preview leve de componentes de UI isolados — alternativa mínima a
 * Storybook, sem controles/knobs, só instâncias de exemplo lado a lado.
 *
 * NUNCA pode ficar acessível em produção (página de debug, não é rota de
 * produto). Gate: `notFound()` antes de qualquer render, mesmo padrão de
 * early-return usado em server/permissions/index.ts (ex.: requireStaff()).
 * Defesa em profundidade adicional em middleware.ts, que já bloqueia
 * `/dev/*` com 404 no edge quando NODE_ENV=production, antes mesmo desta
 * página rodar.
 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-12 px-6 py-12">
      <header className="space-y-1">
        <p className="k-eyebrow text-muted-foreground">/dev/ui · dev only</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Preview de componentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Vitrine rápida dos primitivos mais usados, pra ver mudanças de UI
          isoladas sem navegar pelo app inteiro. Bloqueada em produção (404
          assim que <code>NODE_ENV=production</code>).
        </p>
      </header>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="blush">Blush</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="forest">Forest</Badge>
          <Badge variant="blush">Blush</Badge>
          <Badge variant="rose">Rose</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status="approved"
            map={{
              pending: { label: "pendente", variant: "secondary" },
              approved: { label: "aprovado", variant: "forest" },
              rejected: { label: "rejeitado", variant: "rose" },
            }}
          />
          <StatusBadge
            status="pending"
            map={{
              pending: { label: "pendente", variant: "secondary" },
              approved: { label: "aprovado", variant: "forest" },
              rejected: { label: "rejeitado", variant: "rose" },
            }}
          />
        </div>
      </Section>

      <Section title="Cards">
        <Card>
          <CardHeader>
            <CardTitle>Título do card</CardTitle>
            <CardDescription>Descrição curta de apoio.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conteúdo de exemplo dentro do card.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Ação</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={CheckCircle2}
          title="Nada por aqui ainda"
          description="Texto de apoio explicando o estado vazio e o que fazer a seguir."
        />
      </Section>

      <Section title="Campos de formulário">
        <div className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dev-ui-input">Nome</Label>
            <Input id="dev-ui-input" placeholder="Digite algo..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-ui-textarea">Mensagem</Label>
            <Textarea id="dev-ui-textarea" placeholder="Escreva aqui..." />
          </div>
        </div>
      </Section>

      <Section title="Glossário / tooltip (SEO-7)">
        <p className="flex items-center gap-1.5 text-sm">
          Edição
          <GlossaryTerm
            term="edição"
            definition="Cada dia de conteúdo gerado para uma plataforma: tendências, headlines, copy e sugestões prontos para revisão."
          />
        </p>
      </Section>

      <Section title="Skeleton (loading)">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Section>

      <Section title="Confirm dialog">
        <ConfirmDialogDemo />
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
