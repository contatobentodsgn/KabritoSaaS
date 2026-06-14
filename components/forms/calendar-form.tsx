"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateCalendarAction } from "@/server/actions/calendar";
import type { Calendar } from "@/server/services/calendar";
import {
  CALENDAR_PLATFORM_OPTIONS,
  CALENDAR_GOAL_OPTIONS,
} from "@/lib/validations/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/content/copy-button";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
};
const GOAL_LABEL: Record<string, string> = {
  engajar: "Engajar",
  vender: "Vender",
  educar: "Educar",
  nutrir: "Nutrir",
};
const DAYS_OPTIONS = [3, 4, 5, 6, 7] as const;

const selectCls =
  "flex h-10 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm transition-[border-color,box-shadow] focus-visible:border-rose-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CalendarForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Calendar | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      niche: String(fd.get("niche") ?? ""),
      platform: String(fd.get("platform") ?? "instagram"),
      days: String(fd.get("days") ?? "5"),
      goal: String(fd.get("goal") ?? "engajar"),
    };
    start(async () => {
      const res = await generateCalendarAction(input);
      if (res.ok) {
        setResult(res.data);
        toast.success("Calendário gerado.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seu calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Seu nicho</Label>
                <Input id="niche" name="niche" placeholder="Ex.: nutrição materna" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <select id="platform" name="platform" className={selectCls} defaultValue="instagram">
                    {CALENDAR_PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Dias</Label>
                  <select id="days" name="days" className={selectCls} defaultValue="5">
                    {DAYS_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} dias</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <select id="goal" name="goal" className={selectCls} defaultValue="engajar">
                  {CALENDAR_GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>{GOAL_LABEL[g]}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? <Loader2 className="animate-spin" /> : <CalendarDays className="size-4" />}
                {pending ? "Gerando..." : "Gerar calendário"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Geração sob demanda com limite por usuário. A saída é validada antes de exibir.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {result ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <p className="k-eyebrow">Tema da semana</p>
                <CardTitle>{result.week_theme}</CardTitle>
              </CardHeader>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.days.map((d, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="forest">{d.day}</Badge>
                      <Badge variant="outline">{d.format}</Badge>
                    </div>
                    <CardTitle className="text-base">{d.headline}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Tema">{d.theme}</Field>
                    <Field label="Gancho">
                      <p className="whitespace-pre-line">{d.hook}</p>
                    </Field>
                    <Field label="CTA">{d.cta}</Field>
                    <div className="flex justify-end">
                      <CopyButton text={`${d.headline}\n\n${d.hook}\n\n${d.cta}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <CalendarDays className="size-6" strokeWidth={1.75} />
              </span>
              <p className="font-medium">Seu calendário aparece aqui</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Informe seu nicho, a plataforma e o objetivo, e a IA monta a semana de conteúdo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
