import React from "react";

/** Kabrito Avatar — circular user/initials image. sizes sm/md/lg/xl. */
export function Avatar({ src, name = "", size = "md", style = {}, ...rest }) {
  const dim = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 }[size] || 40;
  const fontSize = { xs: 10, sm: 13, md: 15, lg: 20, xl: 26 }[size] || 15;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      style={{
        width: dim, height: dim, borderRadius: "var(--radius-full)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0,
        background: "var(--color-primary-soft)", color: "var(--color-primary)",
        fontFamily: "var(--font-sans)", fontWeight: 600, fontSize,
        border: "1px solid var(--color-border-default)",
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (initials || "·")}
    </div>
  );
}
