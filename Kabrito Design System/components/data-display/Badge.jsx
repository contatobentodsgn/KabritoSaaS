import React from "react";

/**
 * Kabrito Badge — small status / category pill.
 * tone: neutral, forest, rose, blush, success, error.
 */
export function Badge({ children, tone = "neutral", style = {}, ...rest }) {
  const tones = {
    neutral: { background: "var(--color-bg-muted)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" },
    forest: { background: "var(--color-primary-soft)", color: "var(--color-primary)", border: "1px solid transparent" },
    rose: { background: "var(--color-secondary-soft)", color: "var(--color-text-warm)", border: "1px solid var(--color-border-accent)" },
    blush: { background: "var(--color-accent-soft)", color: "var(--color-text-warm)", border: "1px solid var(--color-border-accent)" },
    success: { background: "var(--state-success-bg)", color: "var(--state-success-text)", border: "1px solid transparent" },
    error: { background: "var(--state-error-bg)", color: "var(--state-error-text)", border: "1px solid transparent" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
      lineHeight: 1.4, letterSpacing: "0.2px", whiteSpace: "nowrap",
      ...t, ...style,
    }} {...rest}>{children}</span>
  );
}
