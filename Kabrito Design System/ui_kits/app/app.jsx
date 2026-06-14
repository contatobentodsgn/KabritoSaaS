/* Kabrito App — shell + views. Exports window.KApp. Composes DS primitives. */

const Ic = {
  home: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V21H3z"/><path d="M9 21v-7h6v7"/></svg>,
  calendar: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  users: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/></svg>,
  pen: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  card: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  settings: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z"/></svg>,
  bell: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  search: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>,
  plus: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  trend: (p) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>,
};

const NAV = [
  { id: "inicio", label: "Início", icon: Ic.home },
  { id: "agenda", label: "Agenda", icon: Ic.calendar },
  { id: "clientes", label: "Clientes", icon: Ic.users },
  { id: "conteudos", label: "Conteúdos", icon: Ic.pen },
  { id: "fatura", label: "Faturamento", icon: Ic.card },
  { id: "config", label: "Configurações", icon: Ic.settings },
];
const TITLES = { inicio: "Início", agenda: "Agenda", clientes: "Clientes", conteudos: "Conteúdos", fatura: "Faturamento", config: "Configurações" };

function Sidebar({ active, setActive, Avatar }) {
  return (
    <aside style={{ width: 248, flexShrink: 0, background: "var(--color-bg-subtle)", borderRight: "1px solid var(--color-border-default)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <img src="../../assets/logo-kabrito.svg" height="28" alt="Kabrito" />
      </div>
      <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map((n) => {
          const on = n.id === active;
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "9px 12px",
              border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
              fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: on ? 600 : 500,
              background: on ? "var(--color-primary-soft)" : "transparent",
              color: on ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}>
              <n.icon s={19} />{n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 12, borderTop: "1px solid var(--color-border-default)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name="Marina Alves" size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Marina Alves</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text-muted)" }}>Plano Profissional</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, IconButton }) {
  return (
    <header style={{ height: 64, flexShrink: 0, borderBottom: "1px solid var(--color-border-default)", background: "var(--color-bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.4px", color: "var(--color-text-primary)", margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-sm)", padding: "7px 11px", color: "var(--color-text-muted)", width: 220 }}>
          <Ic.search s={16} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}>Buscar…</span>
        </div>
        <IconButton ariaLabel="Notificações" variant="ghost"><Ic.bell s={20} /></IconButton>
      </div>
    </header>
  );
}

/* ── Views ── */
function StatCard({ label, value, delta }) {
  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)", padding: 20 }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--color-primary)" }}><Ic.trend s={14} />{delta}</span>
      </div>
    </div>
  );
}

function ViewInicio({ Badge }) {
  const agenda = [
    { t: "Marina Alves", s: "Sessão individual", h: "09:00", st: "confirmado", tone: "forest" },
    { t: "Grupo de bem-estar", s: "5 participantes", h: "11:30", st: "confirmado", tone: "forest" },
    { t: "João Pedro", s: "Primeira conversa", h: "14:00", st: "aguardando", tone: "blush" },
    { t: "Camila Reis", s: "Acompanhamento", h: "16:30", st: "confirmado", tone: "forest" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
          <StatCard label="Sessões esta semana" value="18" delta="+12%" />
          <StatCard label="Clientes ativos" value="42" delta="+3" />
          <StatCard label="Conteúdos publicados" value="7" delta="+2" />
        </div>
        <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="k-title" style={{ margin: 0 }}>Agenda de hoje</h3>
            <span className="k-caption" style={{ color: "var(--color-text-muted)" }}>Quinta, 13 jun</span>
          </div>
          {agenda.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i < agenda.length - 1 ? "1px solid var(--color-border-default)" : "none" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-muted)", width: 44 }}>{a.h}</div>
              <span style={{ width: 6, height: 32, borderRadius: 99, background: a.tone === "forest" ? "var(--forest-400)" : "var(--blush-400)" }}></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: "var(--color-text-primary)" }}>{a.t}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)" }}>{a.s}</div>
              </div>
              <Badge tone={a.tone === "forest" ? "success" : "blush"}>{a.st}</Badge>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 20 }}>
          <span className="k-eyebrow" style={{ color: "var(--color-accent)" }}>Editorial da semana</span>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, margin: "10px 0 8px", color: "#fff" }}>Respirar é começar de novo</h3>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.6, color: "var(--mint-200)", margin: 0 }}>Seu texto sobre respiração consciente teve 240 leituras esta semana.</p>
        </div>
        <div style={{ background: "var(--color-accent-soft)", border: "1px solid var(--color-border-accent)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <h3 className="k-title" style={{ margin: "0 0 6px", color: "var(--color-text-warm)" }}>Um lembrete gentil</h3>
          <p className="k-body-sm" style={{ color: "var(--color-text-warm)", margin: 0 }}>Você tem 2 confirmações pendentes para amanhã.</p>
        </div>
      </div>
    </div>
  );
}

function ViewClientes({ Button, Badge, Avatar, Input }) {
  const rows = [
    { n: "Marina Alves", e: "marina@email.com", last: "Hoje, 09:00", st: "Ativo", tone: "success" },
    { n: "João Pedro", e: "joao.p@email.com", last: "Ontem", st: "Novo", tone: "blush" },
    { n: "Camila Reis", e: "camila.reis@email.com", last: "3 dias atrás", st: "Ativo", tone: "success" },
    { n: "Bruno Costa", e: "bruno@email.com", last: "1 semana atrás", st: "Pausado", tone: "neutral" },
    { n: "Helena Dias", e: "helena.dias@email.com", last: "Hoje, 16:30", st: "Ativo", tone: "success" },
    { n: "Rafael Lima", e: "rafael@email.com", last: "2 semanas atrás", st: "Pausado", tone: "neutral" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16 }}>
        <div style={{ width: 280 }}><Input placeholder="Buscar cliente…" iconLeft={<Ic.search s={16} />} /></div>
        <Button variant="primary" iconLeft={<Ic.plus s={17} />}>Novo cliente</Button>
      </div>
      <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 80px", padding: "11px 18px", background: "var(--color-bg-muted)", borderBottom: "1px solid var(--color-border-default)" }}>
          {["Cliente", "Última sessão", "Status", ""].map((h, i) => <div key={i} className="k-eyebrow" style={{ color: "var(--color-text-muted)" }}>{h}</div>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 80px", alignItems: "center", padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--color-border-default)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={r.n} size="sm" />
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: "var(--color-text-primary)" }}>{r.n}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--color-text-muted)" }}>{r.e}</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-secondary)" }}>{r.last}</div>
            <div><Badge tone={r.tone}>{r.st}</Badge></div>
            <div style={{ textAlign: "right", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", fontWeight: 700 }}>···</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewConteudos({ Badge, Button }) {
  const posts = [
    { t: "Respirar é começar de novo", st: "Publicado", tone: "success", reads: "240 leituras", g: "var(--gradient-warm)" },
    { t: "Pequenos rituais de manhã", st: "Publicado", tone: "success", reads: "180 leituras", g: "var(--gradient-soft)" },
    { t: "Quando o silêncio acolhe", st: "Rascunho", tone: "neutral", reads: "—", g: "var(--gradient-editorial)" },
    { t: "Limites são cuidado", st: "Agendado", tone: "blush", reads: "Publica em 2 dias", g: "var(--gradient-warm)" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Button variant="primary" iconLeft={<Ic.plus s={17} />}>Novo conteúdo</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ height: 96, background: p.g }}></div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <h3 className="k-heading-3" style={{ margin: 0, color: "var(--color-text-primary)" }}>{p.t}</h3>
                <Badge tone={p.tone}>{p.st}</Badge>
              </div>
              <p className="k-caption" style={{ color: "var(--color-text-muted)", margin: "8px 0 0" }}>{p.reads}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px dashed var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: 64, textAlign: "center" }}>
      <h3 className="k-heading-3" style={{ margin: 0, color: "var(--color-text-primary)" }}>{title}</h3>
      <p className="k-body-sm" style={{ color: "var(--color-text-muted)", margin: "8px 0 0" }}>Esta área faz parte do kit, porém não foi detalhada — mantida em branco propositalmente.</p>
    </div>
  );
}

function AppShell(P) {
  const { Button, IconButton, Card, Badge, Avatar, Input } = P;
  const [active, setActive] = React.useState("inicio");
  let view;
  if (active === "inicio") view = <ViewInicio Badge={Badge} />;
  else if (active === "clientes") view = <ViewClientes Button={Button} Badge={Badge} Avatar={Avatar} Input={Input} />;
  else if (active === "conteudos") view = <ViewConteudos Badge={Badge} Button={Button} />;
  else view = <Placeholder title={TITLES[active]} />;
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg-default)" }}>
      <Sidebar active={active} setActive={setActive} Avatar={Avatar} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar title={TITLES[active]} IconButton={IconButton} />
        <main style={{ flex: 1, overflow: "auto", padding: 28 }}>{view}</main>
      </div>
    </div>
  );
}

Object.assign(window, { KApp: { AppShell } });
