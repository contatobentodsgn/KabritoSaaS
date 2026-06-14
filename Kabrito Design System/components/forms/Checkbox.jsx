import React from "react";

/** Kabrito Checkbox — forest fill when checked, rose focus ring. */
export function Checkbox({ checked = false, onChange, disabled = false, label, id, style = {} }) {
  const boxId = id || (label ? "cb-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <label htmlFor={boxId} style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <button
        id={boxId}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 20, height: 20, flexShrink: 0, padding: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          borderRadius: "var(--radius-xs)",
          border: "1px solid " + (checked ? "var(--color-primary)" : "var(--color-border-strong)"),
          background: checked ? "var(--color-primary)" : "var(--color-bg-surface)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 140ms ease, border-color 140ms ease",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {label && <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--color-text-primary)" }}>{label}</span>}
    </label>
  );
}
