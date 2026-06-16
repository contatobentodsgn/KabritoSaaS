import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { asUser, asService, closeDb } from "./helpers";
import { seedFixtures, type Fixtures } from "./fixtures";

let f: Fixtures;

beforeAll(async () => {
  f = await seedFixtures();
});

afterAll(async () => {
  await closeDb();
});

/* ===========================================================================
 * 6.1 TESTE-ÂNCORA: service_role IGNORA a RLS, cliente RESPEITA.
 * É a prova da premissa do SECURITY_GUIDE §3. Se quebrar, bloqueia o deploy.
 * =========================================================================== */
describe("6.1 Teste-âncora — RLS aplicada via cliente, ignorada via service_role", () => {
  it("usuário A (authenticated) vê só o próprio favorito", async () => {
    const rows = await asUser(f.userA, (tx) => tx`select id, user_id from user_favorites`);
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(f.favA);
    expect(rows[0]!.user_id).toBe(f.userA);
  });

  it("usuário B (authenticated) vê só o próprio favorito", async () => {
    const rows = await asUser(f.userB, (tx) => tx`select id from user_favorites`);
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(f.favB);
  });

  it("A NÃO vê o favorito de B (RLS aplicada) — se vir, RLS quebrada", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from user_favorites where id = ${f.favB}`,
    );
    expect(rows.length).toBe(0);
  });

  it("service_role vê AMBOS os favoritos (RLS ignorada — por isso é isolado)", async () => {
    const rows = await asService((tx) => tx`select id from user_favorites`);
    const ids = rows.map((r) => r.id);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(ids).toContain(f.favA);
    expect(ids).toContain(f.favB);
  });
});

/* ===========================================================================
 * 6.2 Conteúdo editorial: assinatura ativa controla a leitura.
 * =========================================================================== */
describe("6.2 Conteúdo editorial — assinatura ativa + publicado + não expirado", () => {
  it("assinante ATIVO vê a edição publicada e seus itens", async () => {
    const editions = await asUser(
      f.userA,
      (tx) => tx`select id, status from content_editions`,
    );
    const ids = editions.map((r) => r.id);
    expect(ids).toContain(f.publishedEditionId);

    const trends = await asUser(f.userA, (tx) => tx`select id from trend_items`);
    expect(trends.map((r) => r.id)).toContain(f.trendItemId);

    const heads = await asUser(f.userA, (tx) => tx`select id from headlines`);
    expect(heads.map((r) => r.id)).toContain(f.headlineId);
  });

  it("sem assinatura ativa NÃO vê nada do conteúdo editorial", async () => {
    const editions = await asUser(f.noSub, (tx) => tx`select id from content_editions`);
    expect(editions.length).toBe(0);
    const trends = await asUser(f.noSub, (tx) => tx`select id from trend_items`);
    expect(trends.length).toBe(0);
    const heads = await asUser(f.noSub, (tx) => tx`select id from headlines`);
    expect(heads.length).toBe(0);
  });

  it("edição em DRAFT não é vista por usuário final (nem seus itens)", async () => {
    const editions = await asUser(
      f.userA,
      (tx) => tx`select id from content_editions where id = ${f.draftEditionId}`,
    );
    expect(editions.length).toBe(0);
    // a headline da edição draft não aparece
    const heads = await asUser(
      f.userA,
      (tx) => tx`select id from headlines where edition_id = ${f.draftEditionId}`,
    );
    expect(heads.length).toBe(0);
  });

  it("edição publicada mas EXPIRADA não aparece para ninguém", async () => {
    const editions = await asUser(
      f.userA,
      (tx) => tx`select id from content_editions where id = ${f.expiredEditionId}`,
    );
    expect(editions.length).toBe(0);
  });
});

/* ===========================================================================
 * 6.3 Isolamento de dados de usuário (anti-IDOR via RLS).
 * =========================================================================== */
describe("6.3 Isolamento — A não acessa dados de B por id direto", () => {
  it("A não lê assinatura da org de B", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from subscriptions where organization_id = ${f.orgB}`,
    );
    expect(rows.length).toBe(0);
  });

  it("A não lê membros da org de B", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from organization_members where organization_id = ${f.orgB}`,
    );
    expect(rows.length).toBe(0);
  });

  it("A não lê a organização de B", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from organizations where id = ${f.orgB}`,
    );
    expect(rows.length).toBe(0);
  });

  it("A vê a própria org/assinatura (controle positivo)", async () => {
    const own = await asUser(
      f.userA,
      (tx) => tx`select id from subscriptions where organization_id = ${f.orgA}`,
    );
    expect(own.length).toBe(1);
  });
});

/* ===========================================================================
 * 6.4 Escrita restrita: usuário final não escreve conteúdo; staff escreve.
 * =========================================================================== */
describe("6.4 Escrita restrita ao staff; pipeline interno bloqueado p/ usuário", () => {
  it("usuário final NÃO consegue inserir em content_editions (RLS rejeita)", async () => {
    await expect(
      asUser(
        f.userA,
        (tx) =>
          tx`insert into content_editions (title, slug, platform_id, edition_date, status, review_status)
             values ('hack', 'hack', ${f.platformId}, current_date - 10, 'published', 'approved')`,
      ),
    ).rejects.toThrow();
  });

  it("usuário final não atualiza content_editions (0 linhas afetadas)", async () => {
    const res = await asUser(
      f.userA,
      (tx) =>
        tx`update content_editions set title = 'tampered' where id = ${f.publishedEditionId}`,
    );
    expect(res.count).toBe(0);
  });

  it("usuário final NÃO acessa raw_signals / generation_runs / ingestion_sources", async () => {
    const rs = await asUser(f.userA, (tx) => tx`select id from raw_signals`);
    const gr = await asUser(f.userA, (tx) => tx`select id from generation_runs`);
    const src = await asUser(f.userA, (tx) => tx`select id from ingestion_sources`);
    expect(rs.length).toBe(0);
    expect(gr.length).toBe(0);
    expect(src.length).toBe(0);
  });

  it("staff (editor) CONSEGUE inserir conteúdo editorial", async () => {
    const rows = await asUser(
      f.staff,
      (tx) =>
        tx`insert into content_editions (title, slug, platform_id, edition_date, status, review_status)
           values ('Edição do staff', 'edicao-staff', ${f.platformId}, current_date - 7, 'draft', 'pending')
           returning id`,
    );
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBeTruthy();
  });

  it("staff vê o pipeline interno (raw_signals/generation_runs)", async () => {
    const rs = await asUser(f.staff, (tx) => tx`select id from raw_signals`);
    const gr = await asUser(f.staff, (tx) => tx`select id from generation_runs`);
    expect(rs.length).toBeGreaterThanOrEqual(1);
    expect(gr.length).toBeGreaterThanOrEqual(1);
  });
});

/* ===========================================================================
 * 6.5 ESCALADA DE PRIVILÉGIO (regressão da auditoria adversarial)
 * Usuário comum NÃO pode setar o próprio staff_role (proteção de coluna).
 * =========================================================================== */
describe("6.5 Anti-escalada — usuário não vira staff alterando profiles.staff_role", () => {
  it("UPDATE em staff_role da própria linha é NEGADO (permission denied)", async () => {
    await expect(
      asUser(
        f.userA,
        (tx) =>
          tx`update profiles set staff_role = 'superadmin' where user_id = ${f.userA}`,
      ),
    ).rejects.toThrow();
  });

  it("após a tentativa, A continua SEM staff_role (não escalou)", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select staff_role from profiles where user_id = ${f.userA}`,
    );
    expect(rows[0]?.staff_role).toBeNull();
  });

  it("controle: A ainda atualiza colunas próprias permitidas (name)", async () => {
    const res = await asUser(
      f.userA,
      (tx) => tx`update profiles set name = 'Nome Atualizado A' where user_id = ${f.userA}`,
    );
    expect(res.count).toBe(1);
  });
});

/* ===========================================================================
 * 6.6 COMUNIDADE — comentários por edição (migration 0006)
 * =========================================================================== */
describe("6.6 Comentários — leitura/escrita por assinatura + edição publicada", () => {
  it("assinante ativo vê os comentários da edição publicada", async () => {
    const rows = await asUser(f.userA, (tx) => tx`select id from edition_comments`);
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(f.commentA);
    expect(ids).toContain(f.commentB);
  });

  it("assinante ativo consegue comentar (insert próprio)", async () => {
    const rows = await asUser(
      f.userA,
      (tx) =>
        tx`insert into edition_comments (edition_id, user_id, body) values (${f.publishedEditionId}, ${f.userA}, 'novo comentário') returning id`,
    );
    expect(rows.length).toBe(1);
  });

  it("sem assinatura ativa NÃO vê nem comenta", async () => {
    const seen = await asUser(f.noSub, (tx) => tx`select id from edition_comments`);
    expect(seen.length).toBe(0);
    await expect(
      asUser(
        f.noSub,
        (tx) =>
          tx`insert into edition_comments (edition_id, user_id, body) values (${f.publishedEditionId}, ${f.noSub}, 'hack')`,
      ),
    ).rejects.toThrow();
  });

  it("não comenta em edição DRAFT (não publicada)", async () => {
    await expect(
      asUser(
        f.userA,
        (tx) =>
          tx`insert into edition_comments (edition_id, user_id, body) values (${f.draftEditionId}, ${f.userA}, 'x')`,
      ),
    ).rejects.toThrow();
  });

  it("A NÃO apaga o comentário de B; A apaga o próprio; staff modera qualquer um", async () => {
    const aDeletesB = await asUser(
      f.userA,
      (tx) => tx`delete from edition_comments where id = ${f.commentB}`,
    );
    expect(aDeletesB.count).toBe(0);

    const aDeletesOwn = await asUser(
      f.userA,
      (tx) => tx`delete from edition_comments where id = ${f.commentA}`,
    );
    expect(aDeletesOwn.count).toBe(1);

    const staffDeletesB = await asUser(
      f.staff,
      (tx) => tx`delete from edition_comments where id = ${f.commentB}`,
    );
    expect(staffDeletesB.count).toBe(1);
  });
});

/* ===========================================================================
 * 6.7 WORKSPACE DE AGÊNCIA — membros co-visíveis + gestão por owner/admin (0005)
 * =========================================================================== */
describe("6.7 Workspace — co-membros visíveis; só owner/admin gerenciam", () => {
  it("membros da org veem os co-membros (owner e member)", async () => {
    const asOwner = await asUser(
      f.userA,
      (tx) => tx`select user_id from organization_members where organization_id = ${f.orgA}`,
    );
    const asMember = await asUser(
      f.userC,
      (tx) => tx`select user_id from organization_members where organization_id = ${f.orgA}`,
    );
    expect(asOwner.length).toBe(2);
    expect(asMember.length).toBe(2);
  });

  it("quem não é membro NÃO vê os membros da org", async () => {
    const rows = await asUser(
      f.userB,
      (tx) => tx`select user_id from organization_members where organization_id = ${f.orgA}`,
    );
    expect(rows.length).toBe(0);
  });

  it("owner adiciona membro; membro comum NÃO consegue", async () => {
    const ownerAdds = await asUser(
      f.userA,
      (tx) =>
        tx`insert into organization_members (organization_id, user_id, role) values (${f.orgA}, ${crypto.randomUUID()}, 'member') returning id`,
    );
    expect(ownerAdds.length).toBe(1);

    await expect(
      asUser(
        f.userC,
        (tx) =>
          tx`insert into organization_members (organization_id, user_id, role) values (${f.orgA}, ${crypto.randomUUID()}, 'member')`,
      ),
    ).rejects.toThrow();
  });

  it("owner atualiza papel de membro; membro comum não (0 linhas)", async () => {
    const ownerUpdates = await asUser(
      f.userA,
      (tx) => tx`update organization_members set role = 'admin' where organization_id = ${f.orgA} and user_id = ${f.userC}`,
    );
    expect(ownerUpdates.count).toBe(1);

    // Reverte C para "member" para não contaminar os testes seguintes (6.8).
    await asUser(
      f.userA,
      (tx) => tx`update organization_members set role = 'member' where organization_id = ${f.orgA} and user_id = ${f.userC}`,
    );
  });
});

/* ===========================================================================
 * 6.8 CONVITES — só owner/admin enxergam e gerenciam (migration 0007)
 * =========================================================================== */
describe("6.8 Convites — gestão restrita a owner/admin", () => {
  it("owner vê os convites pendentes da org", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from org_invites where organization_id = ${f.orgA}`,
    );
    expect(rows.map((r) => r.id)).toContain(f.inviteId);
  });

  it("membro comum e não-membro NÃO veem convites", async () => {
    const asMember = await asUser(
      f.userC,
      (tx) => tx`select id from org_invites where organization_id = ${f.orgA}`,
    );
    const asOutsider = await asUser(
      f.userB,
      (tx) => tx`select id from org_invites where organization_id = ${f.orgA}`,
    );
    expect(asMember.length).toBe(0);
    expect(asOutsider.length).toBe(0);
  });

  it("owner cria convite; membro comum NÃO consegue", async () => {
    const ownerCreates = await asUser(
      f.userA,
      (tx) =>
        tx`insert into org_invites (organization_id, email, role, token) values (${f.orgA}, 'novo@example.com', 'member', ${crypto.randomUUID()}) returning id`,
    );
    expect(ownerCreates.length).toBe(1);

    await expect(
      asUser(
        f.userC,
        (tx) =>
          tx`insert into org_invites (organization_id, email, role, token) values (${f.orgA}, 'x@example.com', 'member', ${crypto.randomUUID()})`,
      ),
    ).rejects.toThrow();
  });
});

/* ===========================================================================
 * 6.9 PERFIS PÚBLICOS — view dedicada expõe nome/avatar, não o profile (0008)
 * =========================================================================== */
describe("6.9 public_profiles — nome cross-user sem vazar o profile", () => {
  it("A lê o NOME público de B via public_profiles", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select user_id, name from public_profiles where user_id = ${f.userB}`,
    );
    expect(rows.length).toBe(1);
    expect(rows[0]!.name).toBe("B");
  });

  it("A NÃO lê a linha de profile de B diretamente (RLS intacta)", async () => {
    const rows = await asUser(
      f.userA,
      (tx) => tx`select id from profiles where user_id = ${f.userB}`,
    );
    expect(rows.length).toBe(0);
  });
});

/* ===========================================================================
 * 6.10 LOCKDOWN de deleted_at (migration 0009 — regressão da auditoria)
 * Usuário NÃO pode escrever a própria flag de exclusão → exclusão de conta não
 * é reversível por auto-ressurreição via PostgREST. Mesmo padrão do 6.5.
 * =========================================================================== */
describe("6.10 Anti auto-ressurreição — usuário não escreve profiles.deleted_at", () => {
  it("UPDATE em deleted_at da própria linha é NEGADO (permission denied)", async () => {
    await expect(
      asUser(
        f.userA,
        (tx) => tx`update profiles set deleted_at = null where user_id = ${f.userA}`,
      ),
    ).rejects.toThrow();
  });

  it("controle: A ainda atualiza colunas próprias permitidas (avatar_url)", async () => {
    const res = await asUser(
      f.userA,
      (tx) =>
        // URL precisa casar com o CHECK profiles_avatar_url_supabase (migration 0012).
        tx`update profiles set avatar_url = 'https://test.supabase.co/storage/v1/object/public/avatars/a.png' where user_id = ${f.userA}`,
    );
    expect(res.count).toBe(1);
  });
});

/* ===========================================================================
 * 6.11 CARDS DO PAINEL — feature-flags (migration 0010)
 * Qualquer assinante LÊ (config global de UI); só STAFF alterna a visibilidade.
 * =========================================================================== */
describe("6.11 dashboard_cards — leitura geral, escrita só staff", () => {
  it("usuário comum LÊ os cards (config global)", async () => {
    const rows = await asUser(f.userA, (tx) => tx`select key from dashboard_cards`);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("usuário comum NÃO consegue alternar (0 linhas afetadas)", async () => {
    const res = await asUser(
      f.userA,
      (tx) => tx`update dashboard_cards set enabled = false where key = 'trends'`,
    );
    expect(res.count).toBe(0);
  });

  it("staff CONSEGUE alternar (idempotente: calendario permanece off)", async () => {
    const res = await asUser(
      f.staff,
      (tx) => tx`update dashboard_cards set enabled = false where key = 'calendario'`,
    );
    expect(res.count).toBe(1);
  });
});
