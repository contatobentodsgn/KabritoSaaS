import {
  listCategories,
  listTemplates,
  listNiches,
  listTags,
} from "@/server/services/admin";
import {
  createCategory,
  createTemplate,
  createNiche,
  createTag,
} from "@/server/actions/admin";
import { PageHeader } from "@/components/layout/page-header";
import { CreateForm } from "@/components/admin/create-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Prompts & taxonomia · Admin" };

export default async function AdminPromptsPage() {
  const [categories, templates, niches, tags] = await Promise.all([
    listCategories(),
    listTemplates(),
    listNiches(),
    listTags(),
  ]);

  return (
    <>
      <span className="k-eyebrow">Catálogo global</span>
      <PageHeader
        title="Prompts & taxonomia"
        description="Prompts evergreen, categorias, nichos e tags do catálogo global."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias de prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Badge key={c.id} variant="secondary">{c.name}</Badge>
              ))}
            </div>
            <CreateForm
              action={createCategory}
              submitLabel="Nova categoria"
              fields={[
                { name: "name", label: "Nome", required: true },
                { name: "slug", label: "Slug", required: true, placeholder: "copywriting" },
                { name: "description", label: "Descrição", type: "textarea" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nichos & tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="k-eyebrow mb-1">Nichos</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {niches.map((n) => (
                  <Badge key={n.id} variant="outline">{n.slug}</Badge>
                ))}
              </div>
              <CreateForm
                action={createNiche}
                submitLabel="Novo nicho"
                fields={[
                  { name: "name", label: "Nome", required: true },
                  { name: "slug", label: "Slug", required: true, placeholder: "marketing" },
                  { name: "description", label: "Descrição", type: "textarea" },
                ]}
              />
            </div>
            <div>
              <p className="k-eyebrow mb-1">Tags</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t.id} variant="outline">{t.slug}</Badge>
                ))}
              </div>
              <CreateForm
                action={createTag}
                submitLabel="Nova tag"
                fields={[
                  { name: "name", label: "Nome", required: true },
                  { name: "slug", label: "Slug", required: true },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prompts ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-md border p-3">
                <p className="font-medium">{t.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.objective}</p>
              </div>
            ))}
          </div>
          {categories.length > 0 ? (
            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">Novo prompt</p>
              <CreateForm
                action={createTemplate}
                submitLabel="Criar prompt"
                fields={[
                  {
                    name: "categoryId",
                    label: "Categoria",
                    type: "select",
                    options: categories.map((c) => ({ value: c.id, label: c.name })),
                  },
                  { name: "title", label: "Título", required: true },
                  { name: "objective", label: "Objetivo", required: true },
                  { name: "whenToUse", label: "Quando usar", type: "textarea", required: true },
                  { name: "requiredInput", label: "Inputs necessários (separados por vírgula)" },
                  { name: "promptBody", label: "Prompt", type: "textarea", required: true },
                  { name: "exampleOutput", label: "Exemplo de saída", type: "textarea", required: true },
                  { name: "tags", label: "Tags (separadas por vírgula)" },
                ]}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Crie uma categoria antes de adicionar prompts.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
