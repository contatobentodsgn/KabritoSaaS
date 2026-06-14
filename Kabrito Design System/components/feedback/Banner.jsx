import React from "react";

/**
 * Kabrito Banner — inline status message.
 * tone: success, error, warning, info (maps to state tokens).
 */
export function Banner({ children, tone = "info", title, icon = null, onClose, style = {} }) {
  const tones = {
    success: { bg: "var(--state-success-bg)", fg: "var(--state-success-text)", bd: "var(--color-border-strong)" },
    error: { bg: "var(--state-error-bg)", fg: "var(--state-error-text)", bd: "var(--color-border-accent)" },
    warning: { bg: "var(--state-warning-bg)", fg: "var(--state-warning-text)", bd: "var(--color-border-accent)" },
    info: { bg: "var(--state-info-bg)", fg: "var(--state-info-text)", bd: "var(--color-border-strong)" },
  };
  const t = tones[tone] || tones.info;
  return (
    <div role="status" style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      background: t.bg, color: t.fg,
      border: "1px solid " + t.bd, borderRadius: "var(--radius-md)",
      padding: "12px 14px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45,
      ...style,
    }}>
      {icon && <span style={{ display: "inline-flex", marginTop: 1, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Fechar" style={{
          border: "none", background: "transparent", color: t.fg, cursor: "pointer",
          opacity: 0.6, padding: 0, lineHeight: 1, fontSize: 18,
        }}>×</button>
      )}
    </div>
  );
}
