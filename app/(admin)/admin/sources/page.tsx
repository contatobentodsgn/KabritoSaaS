import { listSources, listAllPlatforms } from "@/server/services/admin";
import { canManagePipeline } from "@/server/permissions";
import { createSource } from "@/server/actions/admin/sources";
import { createPlatform } from "@/server/actions/admin/taxonomy";
import { PageHeader } from "@/components/layout/page-header";
import { CreateForm } from "@/components/admin/create-form";
import { SourceToggle } from "@/components/admin/source-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Fontes · Admin" };

export default async function SourcesPage() {
  const [sources, platforms, canManage] = await Promise.all([
    listSources(),
    listAllPlatforms(),
    canManagePipeline(),
  ]);

  return (
    <>
      <span className="k-eyebrow">Pipeline</span>
      <PageHeader
        title="Fontes de ingestão & plataformas"
        description="Fontes legais (sem scraping de redes). Config do pipeline = superadmin."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fontes de ingestão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma fonte ainda.
              </p>
            )}
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    tipo: {s.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.is_active ? "success" : "outline"}>
                    {s.is_active ? "ativa" : "inativa"}
                  </Badge>
                  {canManage && <SourceToggle id={s.id} active={s.is_active} />}
                </div>
              </div>
            ))}

            {canManage ? (
              <div className="rounded-md border border-dashed p-3">
                <p className="mb-2 text-sm font-medium">Nova fonte</p>
                <CreateForm
                  action={createSource}
                  submitLabel="Adicionar fonte"
                  fields={[
                    {
                      name: "name",
                      label: "Nome",
                      required: true,
                      placeholder: "Ex.: Google Trends BR",
                    },
                    {
                      name: "type",
                      label: "Tipo",
                      type: "select",
                      options: [
                        { value: "rss", label: "RSS" },
                        { value: "api", label: "API" },
                        { value: "trends", label: "Trends" },
                        { value: "manual_seed", label: "Seed manual" },
                      ],
                    },
                    {
                      name: "configJson",
                      label: "Config (JSON)",
                      type: "textarea",
                      placeholder: '{ "url": "https://exemplo.com/feed" }',
                    },
                    {
                      name: "isActive",
                      label: "Ativa",
                      type: "checkbox",
                      defaultChecked: true,
                    },
                  ]}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Apenas superadmin configura fontes do pipeline.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plataformas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {platforms.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <Badge variant={p.is_active ? "success" : "outline"}>
                  {p.is_active ? "ativa" : "inativa"}
                </Badge>
              </div>
            ))}
            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">Nova plataforma</p>
              <CreateForm
                action={createPlatform}
                submitLabel="Adicionar plataforma"
                fields={[
                  {
                    name: "name",
                    label: "Nome",
                    required: true,
                    placeholder: "LinkedIn",
                  },
                  {
                    name: "slug",
                    label: "Slug",
                    required: true,
                    placeholder: "linkedin",
                  },
                  {
                    name: "isActive",
                    label: "Ativa",
                    type: "checkbox",
                    defaultChecked: true,
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
