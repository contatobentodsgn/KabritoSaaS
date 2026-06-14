import React from "react";

/**
 * Kabrito Input — text/number/email field with optional label & helper.
 * Tight 6px radius (deliberately squarer than the pill CTAs); rose focus ring.
 */
export function Input({
  label,
  helper,
  error,
  iconLeft = null,
  type = "text",
  id,
  value,
  placeholder,
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const fieldId = id || (label ? "in-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  const borderColor = error
    ? "var(--color-secondary)"
    : focus
    ? "var(--color-border-focus)"
    : "var(--color-border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{
          fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500,
          color: "var(--color-text-primary)",
        }}>{label}</label>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: disabled ? "var(--color-bg-muted)" : "var(--color-bg-surface)",
        border: "1px solid " + borderColor,
        borderRadius: "var(--radius-sm)",
        padding: "9px 12px",
        boxShadow: focus ? "var(--shadow-focus)" : "none",
        transition: "border-color 140ms ease, box-shadow 140ms ease",
      }}>
        {iconLeft && <span style={{ color: "var(--color-text-muted)", display: "inline-flex" }}>{iconLeft}</span>}
        <input
          id={fieldId}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.4,
            color: "var(--color-text-primary)", minWidth: 0,
          }}
          {...rest}
        />
      </div>
      {(helper || error) && (
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: error ? "var(--color-secondary-hover)" : "var(--color-text-muted)",
        }}>{error || helper}</span>
      )}
    </div>
  );
}
