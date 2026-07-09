"use client";

import { useState, useTransition } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adaptAction } from "@/server/actions/translate";
import type { Adaptation } from "@/server/services/translate";
import { PLATFORM_OPTIONS, FORMAT_OPTIONS } from "@/lib/validations/translate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/content/copy-button";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
};
const FORMAT_LABEL: Record<string, string> = {
  carrossel: "Carrossel",
  reels: "Reels",
  post_unico: "Post único",
  story: "Story",
  thread: "Thread",
  post_linkedin: "Post LinkedIn",
};

const selectCls =
  "flex h-10 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm transition-[border-color,box-shadow] focus-visible:border-rose-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function AdaptForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Adaptation | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      niche: String(fd.get("niche") ?? ""),
      source: String(fd.get("source") ?? ""),
      platform: String(fd.get("platform") ?? "instagram"),
      format: String(fd.get("format") ?? "carrossel"),
    };
    start(async () => {
      const res = await adaptAction(input);
      if (res.ok) {
        setResult(res.data);
        toast.success("Adaptação gerada.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sua adaptação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Seu nicho</Label>
              <Input
                id="niche"
                name="niche"
                placeholder="Ex.: nutrição materna"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Pauta, headline ou ideia a adaptar</Label>
              <Textarea
                id="source"
                name="source"
                rows={5}
                placeholder="Cole aqui uma pauta ou headline da edição de hoje, ou descreva a ideia."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <select
                  id="platform"
                  name="platform"
                  className={selectCls}
                  defaultValue="instagram"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <select
                  id="format"
                  name="format"
                  className={selectCls}
                  defaultValue="carrossel"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABEL[f]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {pending ? "Adaptando..." : "Adaptar ao meu nicho"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Geração sob demanda com limite por usuário. A saída é validada
              antes de exibir.
            </p>
          </form>
        </CardContent>
      </Card>

      <div>
        {result ? (
          <Card>
            <CardHeader>
              <p className="k-eyebrow">Resultado</p>
              <CardTitle>{result.adapted_headline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Ideia central">{result.central_idea}</Field>
              <Field label="Estrutura do post">
                <p className="whitespace-pre-line">{result.post_structure}</p>
              </Field>
              <div className="rounded-md border bg-mint-50 dark:bg-forest-950/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="k-eyebrow">Legenda</p>
                  <CopyButton text={result.caption} />
                </div>
                <p className="whitespace-pre-line text-sm">{result.caption}</p>
              </div>
              <Field label="CTA">{result.cta}</Field>
              <Field label="Dicas de adaptação">
                <ul className="list-inside list-disc space-y-1">
                  {result.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </Field>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900 text-forest-700 dark:text-forest-200">
                <Wand2 className="size-6" strokeWidth={1.75} />
              </span>
              <p className="font-medium">Sua adaptação aparece aqui</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Informe seu nicho e o conteúdo base, e a IA reescreve para o seu
                público.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
