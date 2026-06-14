import { randomUUID } from "node:crypto";
import { sql } from "./helpers";

/**
 * Cenário de teste (SECURITY_GUIDE §6):
 *  - Usuário A (org A) e B (org B), cada um com assinatura ATIVA e 1 favorito.
 *  - noSub (org canceled) — sem assinatura ativa.
 *  - staff (editor) — escreve conteúdo editorial.
 *  - Edições: publicada+não-expirada / draft / publicada+expirada.
 * Tudo inserido como superuser (bypass RLS) — é o "service_role" semeando.
 */
export interface Fixtures {
  userA: string;
  userB: string;
  userC: string; // membro (não-owner) da orgA — para testes de workspace
  noSub: string;
  staff: string;
  orgA: string;
  orgB: string;
  platformId: string;
  publishedEditionId: string;
  draftEditionId: string;
  expiredEditionId: string;
  trendItemId: string;
  headlineId: string;
  favA: string;
  favB: string;
  commentA: string; // comentário do A na edição publicada
  commentB: string; // comentário do B na edição publicada
  inviteId: string; // convite pendente na orgA
}

const TABLES = [
  "org_invites",
  "edition_comments",
  "user_favorites",
  "user_sessions",
  "access_logs",
  "audit_logs",
  "trend_items",
  "explore_reports",
  "copy_patterns",
  "visual_patterns",
  "headlines",
  "content_suggestions",
  "raw_signals",
  "generation_runs",
  "content_editions",
  "prompt_templates",
  "prompt_categories",
  "subscriptions",
  "organization_members",
  "organizations",
  "profiles",
  "plans",
  "niches",
  "content_tags",
  "ingestion_sources",
  "platforms",
];

export async function resetDb() {
  await sql.unsafe(
    `truncate table ${TABLES.map((t) => `"${t}"`).join(", ")} restart identity cascade`,
  );
}

export async function seedFixtures(): Promise<Fixtures> {
  await resetDb();

  const userA = randomUUID();
  const userB = randomUUID();
  const userC = randomUUID();
  const noSub = randomUUID();
  const staff = randomUUID();

  const [platform] = await sql`
    insert into platforms (name, slug) values ('Instagram', 'instagram') returning id`;
  const platformId = platform!.id as string;

  const [plan] = await sql`
    insert into plans (name, slug, retention_days) values ('Plano Único', 'plano-unico', 60) returning id`;
  const planId = plan!.id as string;

  // Orgs + membros + perfis
  async function makeAccount(
    userId: string,
    label: string,
    subStatus: string,
    staffRole: string | null,
  ) {
    const [org] = await sql`
      insert into organizations (name, slug, owner_id)
      values (${`Org ${label}`}, ${`org-${label.toLowerCase()}-${userId.slice(0, 6)}`}, ${userId})
      returning id`;
    const orgId = org!.id as string;
    await sql`insert into organization_members (organization_id, user_id, role)
      values (${orgId}, ${userId}, 'owner')`;
    await sql`insert into profiles (user_id, name, email, staff_role)
      values (${userId}, ${label}, ${`${label.toLowerCase()}@example.com`}, ${staffRole})`;
    await sql`insert into subscriptions (organization_id, plan_id, subscription_status, current_period_end)
      values (${orgId}, ${planId}, ${subStatus}, now() + interval '30 days')`;
    return orgId;
  }

  const orgA = await makeAccount(userA, "A", "active", null);
  const orgB = await makeAccount(userB, "B", "active", null);
  await makeAccount(noSub, "NoSub", "canceled", null);
  await makeAccount(staff, "Staff", "active", "editor");

  // Favoritos (1 por usuário)
  const [fa] = await sql`
    insert into user_favorites (user_id, organization_id, entity_type, entity_id)
    values (${userA}, ${orgA}, 'headline', ${randomUUID()}) returning id`;
  const [fb] = await sql`
    insert into user_favorites (user_id, organization_id, entity_type, entity_id)
    values (${userB}, ${orgB}, 'headline', ${randomUUID()}) returning id`;

  // userC = membro (não-owner) da orgA, para testes de workspace de agência.
  await sql`insert into profiles (user_id, name, email) values (${userC}, 'C', 'c@example.com')`;
  await sql`insert into organization_members (organization_id, user_id, role)
    values (${orgA}, ${userC}, 'member')`;

  // Edições: publicada / draft / expirada (datas distintas p/ a unique key)
  const [pub] = await sql`
    insert into content_editions (title, slug, platform_id, edition_date, status, review_status, published_at, content_expires_at)
    values ('Edição Publicada', 'edicao-publicada', ${platformId}, current_date, 'published', 'approved', now(), now() + interval '30 days')
    returning id`;
  const publishedEditionId = pub!.id as string;

  const [draft] = await sql`
    insert into content_editions (title, slug, platform_id, edition_date, status, review_status)
    values ('Edição Draft', 'edicao-draft', ${platformId}, current_date - 1, 'draft', 'pending')
    returning id`;
  const draftEditionId = draft!.id as string;

  const [expired] = await sql`
    insert into content_editions (title, slug, platform_id, edition_date, status, review_status, published_at, content_expires_at)
    values ('Edição Expirada', 'edicao-expirada', ${platformId}, current_date - 2, 'published', 'approved', now() - interval '40 days', now() - interval '1 day')
    returning id`;
  const expiredEditionId = expired!.id as string;

  // Itens da edição publicada
  const [trend] = await sql`
    insert into trend_items (edition_id, platform_id, title, context, why_it_matters, adaptation_tips,
      risk_level, saturation_level, opportunity_score, content_format, recommended_niches, adaptation_examples)
    values (${publishedEditionId}, ${platformId}, 'Tendência X', 'contexto da tendência', 'por que importa agora',
      'dicas de adaptação detalhadas', 'baixo', 'emergente', 80,
      ${sql.json(["carrossel", "reels"])}, ${sql.json(["marketing"])},
      ${sql.json([{ niche: "marketing", example: "exemplo" }])})
    returning id`;
  const trendItemId = trend!.id as string;

  const [hl] = await sql`
    insert into headlines (edition_id, headline, category, trigger_type, why_it_works, adaptations, saturation_level, recommended_niches)
    values (${publishedEditionId}, 'Headline de teste', 'alerta', 'curiosidade', 'funciona porque...',
      ${sql.json(["variação 1", "variação 2"])}, 'baixo', ${sql.json(["marketing"])})
    returning id`;
  const headlineId = hl!.id as string;

  // Item numa edição DRAFT (não deve ser visível a usuário final)
  await sql`
    insert into headlines (edition_id, headline, category, trigger_type, why_it_works, adaptations, saturation_level, recommended_niches)
    values (${draftEditionId}, 'Headline DRAFT', 'alerta', 'curiosidade', 'rascunho',
      ${sql.json(["x"])}, 'baixo', ${sql.json(["marketing"])})`;

  // Pipeline interno
  const [source] = await sql`
    insert into ingestion_sources (name, type, config) values ('RSS Teste', 'rss', ${sql.json({ url: "https://example.com/feed" })}) returning id`;
  await sql`insert into generation_runs (edition_date, platform_id, status) values (current_date, ${platformId}, 'completed')`;
  await sql`insert into raw_signals (source_id, platform_id, raw_payload) values (${source!.id}, ${platformId}, ${sql.json({ k: "v" })})`;

  // Comentários (comunidade) na edição publicada.
  const [ca] = await sql`
    insert into edition_comments (edition_id, user_id, body)
    values (${publishedEditionId}, ${userA}, 'Comentário do A') returning id`;
  const [cb] = await sql`
    insert into edition_comments (edition_id, user_id, body)
    values (${publishedEditionId}, ${userB}, 'Comentário do B') returning id`;

  // Convite pendente na orgA (workspace de agência).
  const [inv] = await sql`
    insert into org_invites (organization_id, email, role, token)
    values (${orgA}, 'convidado@example.com', 'member', ${randomUUID()}) returning id`;

  return {
    userA,
    userB,
    userC,
    noSub,
    staff,
    orgA,
    orgB,
    platformId,
    publishedEditionId,
    draftEditionId,
    expiredEditionId,
    trendItemId,
    headlineId,
    favA: fa!.id as string,
    favB: fb!.id as string,
    commentA: ca!.id as string,
    commentB: cb!.id as string,
    inviteId: inv!.id as string,
  };
}
