import { Badge } from "@/components/ui/badge";

/** Lista de pílulas (tags, nichos, formatos) — tons suaves de marca. */
export function Pills({
  items,
  variant = "secondary",
}: {
  items: string[];
  variant?: "secondary" | "outline";
}) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant={variant} className="font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

/** Campo rotulado vertical. `action` (opcional) aparece à direita do rótulo. */
export function Field({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="k-eyebrow text-muted-foreground">{label}</p>
        {action}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// Tons de marca: verde detém a autoridade (oportunidade/calmaria),
// blush/rose entram só na emoção/alerta — nunca o vermelho destrutivo.
const SATURATION_VARIANT: Record<string, "forest" | "secondary" | "blush" | "rose"> = {
  emergente: "forest",
  baixo: "forest",
  medio: "secondary",
  alto: "blush",
  saturado: "rose",
};

export function SaturationBadge({ level }: { level: string }) {
  return <Badge variant={SATURATION_VARIANT[level] ?? "secondary"}>saturação: {level}</Badge>;
}

const RISK_VARIANT: Record<string, "forest" | "blush" | "rose"> = {
  baixo: "forest",
  medio: "blush",
  alto: "rose",
};

export function RiskBadge({ level }: { level: string }) {
  return <Badge variant={RISK_VARIANT[level] ?? "secondary"}>risco: {level}</Badge>;
}

// Dificuldade: verde = fácil/acessível, blush = mais trabalhoso (sem alarme).
const DIFFICULTY_VARIANT: Record<string, "forest" | "secondary" | "blush"> = {
  facil: "forest",
  medio: "secondary",
  dificil: "blush",
};

export function DifficultyBadge({ level }: { level: string }) {
  return (
    <Badge variant={DIFFICULTY_VARIANT[level] ?? "secondary"}>dificuldade: {level}</Badge>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const v = score >= 70 ? "forest" : score >= 40 ? "secondary" : "blush";
  return <Badge variant={v}>oportunidade {score}</Badge>;
}
