import { Sparkles } from "lucide-react";
import { requireActiveSubscription } from "@/server/permissions";
import { listPrompts } from "@/server/services/content";
import { getFavoriteKeySet } from "@/server/services/favorites";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, SectionTitle } from "@/components/content/empty-state";
import { PromptCard } from "@/components/content/prompt-card";

export const metadata = { title: "Prompts · Inteligência Criativa" };

export default async function PromptsPage() {
  await requireActiveSubscription();
  const [{ categories, prompts }, favs] = await Promise.all([
    listPrompts(),
    getFavoriteKeySet(),
  ]);

  if (prompts.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Biblioteca"
          title="Prompts"
          description="Biblioteca de prompts prontos para usar."
        />
        <EmptyState icon={Sparkles} title="Sem prompts cadastrados ainda" />
      </>
    );
  }

  const byCategory = new Map<string, typeof prompts>();
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  for (const p of prompts) {
    const key = p.category_id ?? "outros";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(p);
  }

  return (
    <>
      <PageHeader
        eyebrow="Biblioteca"
        title="Prompts"
        description="Biblioteca de prompts prontos para usar."
      />
      {[...byCategory.entries()].map(([catId, items]) => (
        <section key={catId}>
          <SectionTitle>{catName.get(catId) ?? "Outros"}</SectionTitle>
          <div className="grid gap-4">
            {items.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                favorited={favs.has(`prompt_template:${p.id}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
