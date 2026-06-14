/* Kabrito Marketing — shared inline icons + section components.
   Exports to window for index.html to compose. */

const I = {
  Leaf: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>,
  Calendar: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Pen: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  Heart: (p) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  Arrow: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  Check: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  Star: (p) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.86-5-4.87 7.1-1.01z"/></svg>,
};

function MarketingNav({ Button }) {
  const link = { fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--color-text-secondary)", textDecoration: "none", fontWeight: 500 };
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(247,250,247,0.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--color-border-default)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="../../assets/logo-kabrito.svg" height="30" alt="Kabrito" />
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="#recursos" style={link}>Recursos</a>
          <a href="#precos" style={link}>Preços</a>
          <a href="#sobre" style={link}>Sobre</a>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="#" style={{ ...link, color: "var(--color-text-primary)" }}>Entrar</a>
          <Button variant="primary" size="sm" shape="pill">Criar conta grátis</Button>
        </div>
      </div>
    </nav>
  );
}

function MarketingHero({ Button, Badge }) {
  return (
    <header style={{ background: "var(--gradient-soft)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 28px 80px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 48, alignItems: "center" }}>
        <div>
          <Badge tone="rose"><I.Leaf s={13} /> Para profissionais do cuidado</Badge>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 60, fontWeight: 500, lineHeight: 1.04, letterSpacing: "-1.5px", color: "var(--color-text-primary)", margin: "18px 0 0" }}>
            Sua prática de cuidado, <em style={{ fontStyle: "italic", color: "var(--color-secondary)" }}>com respiro</em>.
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 18, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "20px 0 0", maxWidth: 480 }}>
            Kabrito reúne agenda, clientes e conteúdos editoriais em um só lugar — leve, sensível e feito para quem cuida de pessoas.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Button variant="primary" size="lg" shape="pill" iconRight={<I.Arrow />}>Começar agora</Button>
            <Button variant="outline" size="lg" shape="pill">Ver demonstração</Button>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-text-muted)", marginTop: 16 }}>Grátis para começar · sem cartão de crédito</p>
        </div>
        <MockApp />
      </div>
    </header>
  );
}

function MockApp() {
  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-3)", padding: 18, transform: "rotate(0.5deg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--blush-400)" }}></span>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--mint-300)" }}></span>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--forest-300)" }}></span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text-muted)" }}>Agenda de hoje</span>
      </div>
      {[
        { t: "Sessão · Marina Alves", h: "09:00", c: "var(--forest-100)", d: "var(--forest-600)" },
        { t: "Grupo de bem-estar", h: "11:30", c: "var(--blush-100)", d: "var(--blush-700)" },
        { t: "Novo conteúdo: respiração", h: "14:00", c: "var(--rose-100)", d: "var(--rose-600)" },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-default)", marginBottom: 10 }}>
          <span style={{ width: 8, height: 36, borderRadius: 99, background: r.d }}></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{r.t}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-text-muted)" }}>{r.h} · 50 min</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: r.c, color: r.d }}>confirmado</span>
        </div>
      ))}
    </div>
  );
}

function MarketingFeatures({ Card }) {
  const feats = [
    { icon: <I.Calendar s={22} />, t: "Agenda que respira", d: "Sessões, lembretes e confirmações automáticas — sem o ruído de uma agenda lotada." },
    { icon: <I.Heart s={22} />, t: "Clientes com contexto", d: "Histórico, anotações e evolução de cada pessoa, sempre à mão e com privacidade." },
    { icon: <I.Pen s={22} />, t: "Conteúdo editorial", d: "Publique textos e práticas com a elegância de uma revista — no seu próprio espaço." },
  ];
  return (
    <section id="recursos" style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 28px" }}>
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
        <span className="k-eyebrow" style={{ color: "var(--color-secondary)" }}>Recursos</span>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 500, letterSpacing: "-0.8px", color: "var(--color-text-primary)", margin: "10px 0 0" }}>Tudo o que o cuidado pede, em calma</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {feats.map((f, i) => (
          <Card key={i} variant="default" padding="lg">
            <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--color-primary-soft)", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{f.icon}</div>
            <h3 className="k-heading-3" style={{ margin: "18px 0 8px", color: "var(--color-text-primary)" }}>{f.t}</h3>
            <p className="k-body-sm" style={{ color: "var(--color-text-secondary)", margin: 0 }}>{f.d}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function EditorialBand() {
  return (
    <section id="sobre" style={{ background: "var(--color-primary)", color: "#fff" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "88px 28px", textAlign: "center" }}>
        <div style={{ color: "var(--color-accent)", marginBottom: 18, display: "flex", justifyContent: "center", gap: 4 }}>
          {[0,1,2,3,4].map(i => <I.Star key={i} s={18} />)}
        </div>
        <blockquote style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 500, lineHeight: 1.32, letterSpacing: "-0.5px", margin: 0 }}>
          “Pela primeira vez minha agenda e meus textos moram no mesmo lugar — e tudo ficou mais leve.”
        </blockquote>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 99, background: "var(--blush-200)", color: "var(--forest-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontFamily: "var(--font-sans)" }}>CR</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}>Camila Reis</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--mint-300)" }}>Psicóloga · São Paulo</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketingPricing({ Button, Badge }) {
  const plans = [
    { name: "Essencial", price: "R$0", per: "para sempre", desc: "Para quem está começando.", feats: ["Agenda e lembretes", "Até 10 clientes", "1 espaço editorial"], cta: "Começar grátis", variant: "outline", featured: false },
    { name: "Profissional", price: "R$49", per: "por mês", desc: "Para a prática em crescimento.", feats: ["Clientes ilimitados", "Confirmações automáticas", "Conteúdo editorial completo", "Relatórios de evolução"], cta: "Assinar Profissional", variant: "primary", featured: true },
    { name: "Estúdio", price: "R$129", per: "por mês", desc: "Para equipes e clínicas.", feats: ["Tudo do Profissional", "Até 8 profissionais", "Marca personalizada", "Suporte prioritário"], cta: "Falar com a gente", variant: "outline", featured: false },
  ];
  return (
    <section id="precos" style={{ background: "var(--color-bg-default)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 28px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <span className="k-eyebrow" style={{ color: "var(--color-secondary)" }}>Planos</span>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 500, letterSpacing: "-0.8px", color: "var(--color-text-primary)", margin: "10px 0 0" }}>Comece leve, cresça no seu tempo</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              background: p.featured ? "var(--color-bg-surface)" : "var(--color-bg-subtle)",
              border: "1px solid " + (p.featured ? "var(--color-border-focus)" : "var(--color-border-default)"),
              borderRadius: "var(--radius-xl)", padding: 28, position: "relative",
              boxShadow: p.featured ? "var(--shadow-2)" : "none",
            }}>
              {p.featured && <div style={{ position: "absolute", top: -12, left: 28 }}><Badge tone="blush">Mais popular</Badge></div>}
              <h3 className="k-title" style={{ margin: 0, color: "var(--color-text-primary)" }}>{p.name}</h3>
              <p className="k-caption" style={{ margin: "4px 0 16px", color: "var(--color-text-muted)" }}>{p.desc}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 500, color: "var(--color-text-primary)" }}>{p.price}</span>
                <span className="k-caption" style={{ color: "var(--color-text-muted)" }}>{p.per}</span>
              </div>
              <Button variant={p.variant} fullWidth shape="pill">{p.cta}</Button>
              <div style={{ height: 1, background: "var(--color-border-default)", margin: "22px 0" }}></div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {p.feats.map((f, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-primary)", display: "inline-flex" }}><I.Check /></span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketingFooter() {
  const col = (title, items) => (
    <div>
      <div className="k-eyebrow" style={{ color: "var(--color-text-muted)", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => <a key={i} href="#" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "none" }}>{it}</a>)}
      </div>
    </div>
  );
  return (
    <footer style={{ background: "var(--color-bg-subtle)", borderTop: "1px solid var(--color-border-default)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 40px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <img src="../../assets/logo-kabrito.svg" height="28" alt="Kabrito" />
          <p className="k-body-sm" style={{ color: "var(--color-text-muted)", margin: "14px 0 0", maxWidth: 240 }}>O espaço sensível para quem cuida de pessoas.</p>
        </div>
        {col("Produto", ["Recursos", "Preços", "Novidades", "Segurança"])}
        {col("Empresa", ["Sobre", "Blog editorial", "Carreiras", "Contato"])}
        {col("Suporte", ["Central de ajuda", "Comunidade", "Status", "Termos"])}
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px 40px", display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", fontSize: 13 }}>
        <span>© 2026 Kabrito · feito com cuidado no Brasil</span>
        <span>Privacidade · Termos</span>
      </div>
    </footer>
  );
}

Object.assign(window, { KMarketing: { MarketingNav, MarketingHero, MarketingFeatures, EditorialBand, MarketingPricing, MarketingFooter } });
