import React from "react";

/**
 * Kabrito Tabs — underline tab strip.
 * items: [{ id, label }]. Controlled via value/onChange.
 */
export function Tabs({ items = [], value, onChange, style = {} }) {
  const [internal, setInternal] = React.useState(value || (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;
  const select = (id) => { setInternal(id); onChange && onChange(id); };
  return (
    <div style={{
      display: "flex", gap: 4, borderBottom: "1px solid var(--color-border-default)", ...style,
    }}>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => select(it.id)}
            style={{
              position: "relative", border: "none", background: "transparent",
              padding: "10px 14px 12px", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 15,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              transition: "color 140ms ease",
            }}
          >
            {it.label}
            <span style={{
              position: "absolute", left: 10, right: 10, bottom: -1, height: 2,
              borderRadius: 2,
              background: isActive ? "var(--color-primary)" : "transparent",
              transition: "background 140ms ease",
            }} />
          </button>
        );
      })}
    </div>
  );
}
