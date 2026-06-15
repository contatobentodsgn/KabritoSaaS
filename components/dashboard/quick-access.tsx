import Link from "next/link";
import {
  Flame,
  Radar,
  PenLine,
  Lightbulb,
  Type,
  Image as ImageIcon,
  Sparkles,
  Heart,
  Wand2,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface QuickCounts {
  trends: number;
  explore: number;
  copy: number;
  suggestions: number;
  headlines: number;
  visual: number;
  favorites: number;
}

interface QuickCard {
  icon: LucideIcon;
  title: string;
  sub: string;
  meta: string;
  href: string;
  cta: string;
}

/** Atalhos para tudo da entrega — conteúdo de hoje + biblioteca + ferramentas. */
export function QuickAccess({
  editionId,
  counts,
}: {
  editionId: string;
  counts: QuickCounts;
}) {
  const cards: QuickCard[] = [
    { icon: Flame, title: "Pautas quentes", sub: "Temas em alta hoje", meta: `${counts.trends} temas`, href: "/trends", cta: "Ver pautas" },
    { icon: Radar, title: "Radar de Descoberta", sub: "Padrões em fontes legais", meta: `${counts.explore} análises`, href: `/daily-briefing/${editionId}#radar`, cta: "Abrir radar" },
    { icon: PenLine, title: "Análise de copy", sub: "Ganchos e estruturas que funcionam", meta: `${counts.copy} padrões`, href: `/daily-briefing/${editionId}#copy`, cta: "Ver análise" },
    { icon: Lightbulb, title: "Sugestões de post", sub: "Ideias prontas para adaptar", meta: `${counts.suggestions} disponíveis`, href: `/daily-briefing/${editionId}#sugestoes`, cta: "Abrir sugestões" },
    { icon: Type, title: "Headlines", sub: "Ganchos prontos para adaptar", meta: `${counts.headlines} headlines`, href: "/headlines", cta: "Ver headlines" },
    { icon: ImageIcon, title: "Análise visual", sub: "Padrões visuais reproduzíveis", meta: `${counts.visual} padrões`, href: `/daily-briefing/${editionId}#visual`, cta: "Ver visual" },
    { icon: Sparkles, title: "Prompts", sub: "Biblioteca de prompts prontos", meta: "Biblioteca", href: "/prompts", cta: "Abrir prompts" },
    { icon: Heart, title: "Favoritos", sub: "Seus itens salvos", meta: `${counts.favorites} salvos`, href: "/favorites", cta: "Ver favoritos" },
    { icon: Wand2, title: "Adaptar ao meu nicho", sub: "A IA reescreve a pauta para o seu público", meta: "sob demanda", href: "/adaptar", cta: "Adaptar agora" },
    // "Calendário editorial" ocultado do dashboard (rota /calendario segue ativa).
    // Reexibir: adicionar o card de volta aqui (ou via feature-flag no admin, a fazer).
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.title} href={c.href} className="group">
          <Card className="h-full transition-shadow duration-150 hover:shadow-k-1">
            <CardContent className="flex h-full flex-col gap-3 py-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <c.icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-medium text-foreground">{c.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.sub}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-forest-600">{c.meta}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                  {c.cta}
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
