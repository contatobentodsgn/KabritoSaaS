import React from "react";

/**
 * Kabrito Card — the workhorse surface.
 * variant: default (hairline), elevated (soft shadow), highlight (blush wash),
 * editorial (forest fill, light text). Composes freely via children.
 */
export function Card({
  children,
  variant = "default",
  padding = "lg",
  interactive = false,
  style = {},
  ...rest
}) {
  const pad = { sm: "var(--space-md)", md: "var(--space-lg)", lg: "var(--space-lg)", xl: "var(--space-xl)" }[padding] || "var(--space-lg)";
  const variants = {
    default: { background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)" },
    elevated: { background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)", boxShadow: "var(--shadow-1)" },
    highlight: { background: "var(--color-accent-soft)", border: "1px solid var(--color-border-accent)", color: "var(--color-text-primary)" },
    editorial: { background: "var(--color-primary)", border: "1px solid var(--color-primary)", color: "var(--color-text-inverse)" },
  };
  const v = variants[variant] || variants.default;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        borderRadius: "var(--radius-lg)",
        padding: pad,
        transition: "box-shadow 160ms ease, transform 160ms ease",
        cursor: interactive ? "pointer" : "default",
        transform: interactive && hover ? "translateY(-2px)" : "none",
        ...v,
        ...(interactive && hover ? { boxShadow: "var(--shadow-2)" } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
