import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_CARD_KEYS } from "@/lib/dashboard-cards";
import type {
  EditionRow,
  EditionWithModules,
  PlatformRow,
  TrendItemRow,
  HeadlineRow,
  PromptTemplateRow,
  PromptCategoryRow,
  ExploreReportRow,
  CopyPatternRow,
  VisualPatternRow,
  ContentSuggestionRow,
  BriefingBlock,
} from "@/types/content";

/**
 * Serviço de LEITURA do conteúdo editorial. SEMPRE via cliente Supabase (JWT)
 * → a RLS garante: só edições publicadas, não expiradas, e com assinatura ativa
 * (ou staff). Defesa em profundidade: as páginas também chamam
 * requireActiveSubscription(). (SECURITY_GUIDE §2/§3)
 */

export async function getPlatformBySlug(
  slug: string,
): Promise<PlatformRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PlatformRow) ?? null;
}

/**
 * Keys dos cards do dashboard ATIVOS, NA ORDEM definida em /admin/cards
 * (sort_order). RLS: authenticated lê. FAIL-OPEN: se a tabela não existe ou a
 * query erra, mostra TODOS os cards na ordem canônica — nunca um dashboard vazio.
 * Lista vazia legítima (tabela existe, tudo desativado) é respeitada.
 *
 * CACHEADO (PERF-2): 5min, tag "dashboard-cards". Config de UI global — a
 * RLS aqui é só `auth.uid() is not null` (sem filtro por linha), então o
 * resultado é idêntico pra qualquer usuário autenticado; seguro compartilhar
 * entre requisições/usuários. `createClient()` (que lê cookies da requisição)
 * é resolvido FORA do unstable_cache — chamar cookies()/headers() DENTRO do
 * callback cacheado não é suportado pelo Next e derruba a rota em runtime
 * (erro "used cookies inside a function cached with unstable_cache"); só a
 * query em si roda dentro, via closure do client já resolvido. O `throw`
 * (em vez do fail-open inline) é proposital: erro não fica cacheado — uma
 * falha transitória não "gruda" no cache por 5min, a próxima chamada tenta de
 * novo; o catch externo preserva o fail-open de sempre.
 */
export async function getEnabledCardKeys(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const fetchEnabledCardKeys = unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("dashboard_cards")
          .select("key")
          .eq("enabled", true)
          .order("sort_order");
        if (error) throw new Error(error.message);
        return (data as { key: string }[]).map((r) => r.key);
      },
      ["enabled-card-keys"],
      { revalidate: 300, tags: ["dashboard-cards"] },
    );
    return await fetchEnabledCardKeys();
  } catch {
    return [...DASHBOARD_CARD_KEYS]; // fail-open
  }
}

/** Nichos (vocabulário de curadoria) para popular filtros. RLS: assinante/staff. */
export async function listNiches(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("niches")
    .select("slug, name")
    .order("name");
  return (data as { slug: string; name: string }[]) ?? [];
}

export async function listPlatforms(): Promise<PlatformRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platforms")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .order("name");
  return (data as PlatformRow[]) ?? [];
}

/**
 * "Publicamente" legível: mesma checagem que a RLS de assinante comum faz
 * (`editions_select_published` / `is_edition_published`) — publicada e não
 * expirada. A RLS de staff (`*_staff_all`) NÃO tem essa restrição, então essa
 * função reforça em código o que os caminhos CACHEADOS abaixo precisam: um
 * cache compartilhado entre usuários nunca pode devolver algo que só era
 * visível porque QUEM POPULOU o cache enxergava mais via bypass de staff.
 */
function isPubliclyReadable(
  edition: Pick<EditionRow, "status" | "content_expires_at">,
): boolean {
  if (edition.status !== "published") return false;
  if (
    edition.content_expires_at &&
    new Date(edition.content_expires_at) < new Date()
  ) {
    return false;
  }
  return true;
}

/**
 * Última edição PUBLICADA de uma plataforma.
 *
 * CACHEADO (PERF-2): 5min, tag "editions", chave variando pelo `platformId`
 * (passado como argumento pra função cacheada — o Next varia a chave efetiva
 * pela combinação keyParts + argumentos de chamada). É o mesmo resultado pra
 * qualquer assinante ativo olhando essa plataforma no dia: a query já filtra
 * `status = 'published'` explicitamente (não depende só da RLS pra isso), e
 * quem chama esta função sempre já passou por `requireActiveSubscription()`/
 * `active` — RLS aqui é defesa em profundidade, não o único gate.
 *
 * Igual a `getEnabledCardKeys`, `createClient()` é resolvido FORA do
 * unstable_cache (cookies() não pode rodar dentro do callback cacheado).
 *
 * Trava extra: a query não filtra `content_expires_at`, então a RLS de
 * assinante comum barra edição expirada mas a RLS de staff (`editions_staff_all`)
 * NÃO — se quem populasse o cache fosse staff (ex.: conta interna com
 * assinatura própria pra teste) e a edição mais recente já tivesse expirado,
 * o cache compartilhado devolveria pra QUALQUER usuário uma edição que a RLS
 * de um assinante comum bloquearia numa leitura fresca. Por isso o check de
 * expiração é reforçado em código abaixo, não só na RLS.
 */
export async function getLatestEdition(
  platformSlug = "instagram",
): Promise<EditionRow | null> {
  const supabase = await createClient();
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) return null;

  const fetchLatestEdition = unstable_cache(
    async (platformId: string) => {
      const { data, error } = await supabase
        .from("content_editions")
        .select("*")
        .eq("platform_id", platformId)
        .eq("status", "published")
        .order("edition_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const row = (data as EditionRow) ?? null;
      return row && isPubliclyReadable(row) ? row : null;
    },
    ["latest-edition"],
    { revalidate: 300, tags: ["editions"] },
  );

  try {
    return await fetchLatestEdition(platform.id);
  } catch {
    return null; // não cacheia erro transitório; a próxima chamada tenta de novo
  }
}

export async function listEditions(
  platformSlug?: string,
  limit = 30,
): Promise<EditionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_editions")
    .select("*")
    .eq("status", "published")
    .order("edition_date", { ascending: false })
    .limit(limit);
  if (platformSlug) {
    const platform = await getPlatformBySlug(platformSlug);
    if (!platform) return [];
    query = query.eq("platform_id", platform.id);
  }
  const { data } = await query;
  return (data as EditionRow[]) ?? [];
}

/**
 * Edição completa (todos os módulos de conteúdo) por ID.
 *
 * Chamada em dois contextos bem diferentes:
 *  - Leitor assinante vendo uma edição PUBLICADA (`daily-briefing/[id]`,
 *    `dashboard`) — conteúdo estável, seguro cachear.
 *  - Staff revisando um RASCUNHO em `/admin/review/[id]` — o `ItemEditor`
 *    edita campo a campo e dá `router.refresh()` esperando ver a MUDANÇA
 *    própria na hora; se essa leitura fosse cacheada, o revisor veria o dado
 *    velho logo depois de editar (`router.refresh()` reinvoca o Server
 *    Component, mas uma função cacheada só devolveria o resultado antigo).
 *
 * Por isso o cache é OPT-IN via `{ cached: true }`, default `false` (não
 * cacheado) — o caminho seguro é o padrão; só quem sabe que está lendo
 * conteúdo publicado (dashboard/daily-briefing) pede o cache explicitamente.
 * `/admin/review` não muda: continua chamando sem o 2º argumento.
 *
 * CACHEADO (PERF-2, quando opts.cached): 5min, tag "edition-content" (global,
 * não por edição — `updateItemField`/`deleteItem` em
 * server/actions/admin/review.ts só recebem `table`+`id` do item, não o
 * `editionId` do pai; buscar isso exigiria uma query extra por mutação, então
 * um tag global é suficiente aqui — simples > preciso demais, dado o volume
 * baixo dessas mutações). `createClient()` é resolvido fora do
 * unstable_cache pelo mesmo motivo dos outros dois (cookies() não roda dentro
 * do callback cacheado).
 *
 * Trava extra (mesma lógica de `getLatestEdition`, ver `isPubliclyReadable`):
 * a query desta função não filtra `status`/`content_expires_at` — pra
 * `/admin/review` isso é intencional (staff precisa ver rascunho). Mas se o
 * caminho CACHEADO devolvesse uma edição não-publicada/expirada porque quem
 * chamou era staff (RLS `editions_staff_all` bypassa isso), esse conteúdo
 * entraria no cache COMPARTILHADO e um assinante comum que batesse no mesmo
 * ID receberia pelo cache hit algo que a RLS dele bloquearia numa leitura
 * fresca. Por isso `opts.cached` força o check de `isPubliclyReadable` antes
 * de devolver/cachear — o caminho não-cacheado (admin) continua sem essa
 * trava, vendo rascunho normalmente.
 */
export async function getEditionWithModules(
  editionId: string,
  opts: { cached?: boolean } = {},
): Promise<EditionWithModules | null> {
  const supabase = await createClient();

  const fetchEditionWithModules = async (
    id: string,
  ): Promise<EditionWithModules | null> => {
    const { data: edition } = await supabase
      .from("content_editions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!edition) return null; // RLS pode ter bloqueado → trata como inexistente

    const ed = edition as EditionRow & { briefing: BriefingBlock | null };
    if (opts.cached && !isPubliclyReadable(ed)) return null;

    const [platform, trends, explore, copy, visual, heads, suggestions] =
      await Promise.all([
        supabase
          .from("platforms")
          .select("id, name, slug, is_active")
          .eq("id", ed.platform_id)
          .maybeSingle(),
        supabase.from("trend_items").select("*").eq("edition_id", id),
        supabase.from("explore_reports").select("*").eq("edition_id", id),
        supabase.from("copy_patterns").select("*").eq("edition_id", id),
        supabase.from("visual_patterns").select("*").eq("edition_id", id),
        supabase.from("headlines").select("*").eq("edition_id", id),
        supabase.from("content_suggestions").select("*").eq("edition_id", id),
      ]);

    return {
      edition: ed,
      platform: (platform.data as PlatformRow) ?? null,
      briefing: ed.briefing ?? null,
      // TrendItemRow/CopyPatternRow tipam `adaptation_examples` como
      // AdaptationExample[] (contrato de app); a coluna é jsonb genérico no
      // banco (Json) — daí o `as unknown` antes de estreitar pro tipo real.
      trend_items: (trends.data as unknown as TrendItemRow[]) ?? [],
      explore_reports: (explore.data as ExploreReportRow[]) ?? [],
      copy_patterns: (copy.data as unknown as CopyPatternRow[]) ?? [],
      visual_patterns: (visual.data as VisualPatternRow[]) ?? [],
      headlines: (heads.data as HeadlineRow[]) ?? [],
      content_suggestions: (suggestions.data as ContentSuggestionRow[]) ?? [],
    };
  };

  if (!opts.cached) return fetchEditionWithModules(editionId);

  const cachedFetch = unstable_cache(
    fetchEditionWithModules,
    ["edition-with-modules"],
    { revalidate: 300, tags: ["edition-content"] },
  );
  return cachedFetch(editionId);
}

export async function listHeadlines(limit = 60): Promise<HeadlineRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("headlines")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as HeadlineRow[]) ?? [];
}

export async function listTrends(limit = 60): Promise<TrendItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trend_items")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(limit);
  return (data as unknown as TrendItemRow[]) ?? [];
}

export async function listPrompts(): Promise<{
  categories: PromptCategoryRow[];
  prompts: PromptTemplateRow[];
}> {
  const supabase = await createClient();
  const [cats, prompts] = await Promise.all([
    supabase
      .from("prompt_categories")
      .select("id, name, slug, description")
      .order("name"),
    supabase.from("prompt_templates").select("*").order("title").limit(200),
  ]);
  return {
    categories: (cats.data as PromptCategoryRow[]) ?? [],
    prompts: (prompts.data as PromptTemplateRow[]) ?? [],
  };
}

/**
 * Resolve o slug de plataforma "atual" a partir de um query param, validando
 * contra as plataformas ATIVAS. Default = primeira ativa (ou instagram).
 * Usado pela UI multi-plataforma (MVP 2).
 */
export function resolvePlatformSlug(
  param: string | undefined,
  platforms: PlatformRow[],
): string {
  const slugs = platforms.map((p) => p.slug);
  if (param && slugs.includes(param)) return param;
  return slugs[0] ?? "instagram";
}
