import React from "react";

/** Kabrito Switch — on/off toggle. Forest when on. */
export function Switch({ checked = false, onChange, disabled = false, label, id, style = {} }) {
  const switchId = id || (label ? "sw-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  const toggle = () => { if (!disabled && onChange) onChange(!checked); };
  return (
    <label htmlFor={switchId} style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        disabled={disabled}
        style={{
          position: "relative", width: 42, height: 24, flexShrink: 0,
          borderRadius: "var(--radius-full)", border: "none", padding: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          background: checked ? "var(--color-primary)" : "var(--color-border-strong)",
          transition: "background 160ms ease",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: "var(--radius-full)",
          background: "#fff", boxShadow: "var(--shadow-1)",
          transition: "left 160ms cubic-bezier(0.2,0.8,0.2,1)",
        }} />
      </button>
      {label && <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--color-text-primary)" }}>{label}</span>}
    </label>
  );
}
