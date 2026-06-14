import React from "react";

/**
 * Kabrito Button — the primary action primitive.
 * Variants: primary (Black Forest fill), secondary (Powder Blush fill),
 * outline (hairline), ghost (text-only). Sizes sm / md / lg.
 * Shape: rounded (default) or pill for marketing CTAs.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  shape = "rounded",
  iconLeft = null,
  iconRight = null,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 14, gap: 6, height: 34 },
    md: { padding: "10px 18px", fontSize: 15, gap: 8, height: 42 },
    lg: { padding: "13px 24px", fontSize: 16, gap: 9, height: 50 },
  };
  const variants = {
    primary: {
      background: "var(--button-primary-bg)",
      color: "var(--button-primary-text)",
      border: "1px solid transparent",
    },
    secondary: {
      background: "var(--button-secondary-bg)",
      color: "var(--button-secondary-text)",
      border: "1px solid transparent",
    },
    outline: {
      background: "var(--color-bg-surface)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-primary)",
      border: "1px solid transparent",
    },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const hoverBg = {
    primary: "var(--button-primary-hover)",
    secondary: "var(--button-secondary-hover)",
    outline: "var(--color-bg-muted)",
    ghost: "var(--color-primary-soft)",
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        width: fullWidth ? "100%" : "auto",
        padding: s.padding,
        minHeight: s.height,
        fontFamily: "var(--font-sans)",
        fontSize: s.fontSize,
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: 0,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        borderRadius: shape === "pill" ? "var(--radius-full)" : "var(--radius-md)",
        transition: "background 140ms ease, transform 90ms ease, box-shadow 140ms ease",
        transform: active && !disabled ? "scale(0.97)" : "scale(1)",
        boxShadow: variant === "outline" && hover ? "var(--shadow-1)" : "none",
        ...v,
        ...(hover && !disabled ? { background: hoverBg } : null),
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
