import React from "react";

/**
 * Kabrito IconButton — square/circular control for a single glyph.
 * Pairs with Lucide icons. Variants mirror Button.
 */
export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  shape = "rounded",
  disabled = false,
  ariaLabel,
  onClick,
  style = {},
  ...rest
}) {
  const dims = { sm: 32, md: 40, lg: 48 }[size] || 40;
  const variants = {
    primary: { background: "var(--button-primary-bg)", color: "#fff", border: "1px solid transparent" },
    secondary: { background: "var(--button-secondary-bg)", color: "var(--color-primary)", border: "1px solid transparent" },
    outline: { background: "var(--color-bg-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-default)" },
    ghost: { background: "transparent", color: "var(--color-text-secondary)", border: "1px solid transparent" },
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = React.useState(false);
  const hoverBg = {
    primary: "var(--button-primary-hover)",
    secondary: "var(--button-secondary-hover)",
    outline: "var(--color-bg-muted)",
    ghost: "var(--color-primary-soft)",
  }[variant];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dims,
        height: dims,
        borderRadius: shape === "rounded" ? "var(--radius-md)" : "var(--radius-full)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background 140ms ease, transform 90ms ease",
        ...v,
        ...(hover && !disabled ? { background: hoverBg } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
