/* @ds-bundle: {"format":3,"namespace":"KabritoDesignSystem_0572f5","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"ee546167620a","components/buttons/IconButton.jsx":"689884186788","components/data-display/Avatar.jsx":"872811e03f3e","components/data-display/Badge.jsx":"f6fe3ca55013","components/data-display/Card.jsx":"44b9ec43a649","components/feedback/Banner.jsx":"dcee95733fa7","components/forms/Checkbox.jsx":"b9630e1c65e4","components/forms/Input.jsx":"6f757c972b45","components/forms/Switch.jsx":"0887705173da","components/navigation/Tabs.jsx":"49dd5a3afb3d","ui_kits/app/app.jsx":"8d056bef49e4","ui_kits/marketing/marketing.jsx":"b89d9036bd41"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KabritoDesignSystem_0572f5 = window.KabritoDesignSystem_0572f5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kabrito Button — the primary action primitive.
 * Variants: primary (Black Forest fill), secondary (Powder Blush fill),
 * outline (hairline), ghost (text-only). Sizes sm / md / lg.
 * Shape: rounded (default) or pill for marketing CTAs.
 */
function Button({
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
    sm: {
      padding: "7px 14px",
      fontSize: 14,
      gap: 6,
      height: 34
    },
    md: {
      padding: "10px 18px",
      fontSize: 15,
      gap: 8,
      height: 42
    },
    lg: {
      padding: "13px 24px",
      fontSize: 16,
      gap: 9,
      height: 50
    }
  };
  const variants = {
    primary: {
      background: "var(--button-primary-bg)",
      color: "var(--button-primary-text)",
      border: "1px solid transparent"
    },
    secondary: {
      background: "var(--button-secondary-bg)",
      color: "var(--button-secondary-text)",
      border: "1px solid transparent"
    },
    outline: {
      background: "var(--color-bg-surface)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border-strong)"
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-primary)",
      border: "1px solid transparent"
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const hoverBg = {
    primary: "var(--button-primary-hover)",
    secondary: "var(--button-secondary-hover)",
    outline: "var(--color-bg-muted)",
    ghost: "var(--color-primary-soft)"
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
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
      ...(hover && !disabled ? {
        background: hoverBg
      } : null),
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kabrito IconButton — square/circular control for a single glyph.
 * Pairs with Lucide icons. Variants mirror Button.
 */
function IconButton({
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
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  const variants = {
    primary: {
      background: "var(--button-primary-bg)",
      color: "#fff",
      border: "1px solid transparent"
    },
    secondary: {
      background: "var(--button-secondary-bg)",
      color: "var(--color-primary)",
      border: "1px solid transparent"
    },
    outline: {
      background: "var(--color-bg-surface)",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border-default)"
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-secondary)",
      border: "1px solid transparent"
    }
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = React.useState(false);
  const hoverBg = {
    primary: "var(--button-primary-hover)",
    secondary: "var(--button-secondary-hover)",
    outline: "var(--color-bg-muted)",
    ghost: "var(--color-primary-soft)"
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...(hover && !disabled ? {
        background: hoverBg
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Kabrito Avatar — circular user/initials image. sizes sm/md/lg/xl. */
function Avatar({
  src,
  name = "",
  size = "md",
  style = {},
  ...rest
}) {
  const dim = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72
  }[size] || 40;
  const fontSize = {
    xs: 10,
    sm: 13,
    md: 15,
    lg: 20,
    xl: 26
  }[size] || 15;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: dim,
      height: dim,
      borderRadius: "var(--radius-full)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
      background: "var(--color-primary-soft)",
      color: "var(--color-primary)",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize,
      border: "1px solid var(--color-border-default)",
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials || "·");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kabrito Badge — small status / category pill.
 * tone: neutral, forest, rose, blush, success, error.
 */
function Badge({
  children,
  tone = "neutral",
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      background: "var(--color-bg-muted)",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border-default)"
    },
    forest: {
      background: "var(--color-primary-soft)",
      color: "var(--color-primary)",
      border: "1px solid transparent"
    },
    rose: {
      background: "var(--color-secondary-soft)",
      color: "var(--color-text-warm)",
      border: "1px solid var(--color-border-accent)"
    },
    blush: {
      background: "var(--color-accent-soft)",
      color: "var(--color-text-warm)",
      border: "1px solid var(--color-border-accent)"
    },
    success: {
      background: "var(--state-success-bg)",
      color: "var(--state-success-text)",
      border: "1px solid transparent"
    },
    error: {
      background: "var(--state-error-bg)",
      color: "var(--state-error-text)",
      border: "1px solid transparent"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0.2px",
      whiteSpace: "nowrap",
      ...t,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kabrito Card — the workhorse surface.
 * variant: default (hairline), elevated (soft shadow), highlight (blush wash),
 * editorial (forest fill, light text). Composes freely via children.
 */
function Card({
  children,
  variant = "default",
  padding = "lg",
  interactive = false,
  style = {},
  ...rest
}) {
  const pad = {
    sm: "var(--space-md)",
    md: "var(--space-lg)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)"
  }[padding] || "var(--space-lg)";
  const variants = {
    default: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      color: "var(--color-text-primary)"
    },
    elevated: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      color: "var(--color-text-primary)",
      boxShadow: "var(--shadow-1)"
    },
    highlight: {
      background: "var(--color-accent-soft)",
      border: "1px solid var(--color-border-accent)",
      color: "var(--color-text-primary)"
    },
    editorial: {
      background: "var(--color-primary)",
      border: "1px solid var(--color-primary)",
      color: "var(--color-text-inverse)"
    }
  };
  const v = variants[variant] || variants.default;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      borderRadius: "var(--radius-lg)",
      padding: pad,
      transition: "box-shadow 160ms ease, transform 160ms ease",
      cursor: interactive ? "pointer" : "default",
      transform: interactive && hover ? "translateY(-2px)" : "none",
      ...v,
      ...(interactive && hover ? {
        boxShadow: "var(--shadow-2)"
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
/**
 * Kabrito Banner — inline status message.
 * tone: success, error, warning, info (maps to state tokens).
 */
function Banner({
  children,
  tone = "info",
  title,
  icon = null,
  onClose,
  style = {}
}) {
  const tones = {
    success: {
      bg: "var(--state-success-bg)",
      fg: "var(--state-success-text)",
      bd: "var(--color-border-strong)"
    },
    error: {
      bg: "var(--state-error-bg)",
      fg: "var(--state-error-text)",
      bd: "var(--color-border-accent)"
    },
    warning: {
      bg: "var(--state-warning-bg)",
      fg: "var(--state-warning-text)",
      bd: "var(--color-border-accent)"
    },
    info: {
      bg: "var(--state-info-bg)",
      fg: "var(--state-info-text)",
      bd: "var(--color-border-strong)"
    }
  };
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      background: t.bg,
      color: t.fg,
      border: "1px solid " + t.bd,
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      lineHeight: 1.45,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      marginTop: 1,
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      marginBottom: 2
    }
  }, title), /*#__PURE__*/React.createElement("div", null, children)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Fechar",
    style: {
      border: "none",
      background: "transparent",
      color: t.fg,
      cursor: "pointer",
      opacity: 0.6,
      padding: 0,
      lineHeight: 1,
      fontSize: 18
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Kabrito Checkbox — forest fill when checked, rose focus ring. */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style = {}
}) {
  const boxId = id || (label ? "cb-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: boxId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    id: boxId,
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      padding: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-xs)",
      border: "1px solid " + (checked ? "var(--color-primary)" : "var(--color-border-strong)"),
      background: checked ? "var(--color-primary)" : "var(--color-bg-surface)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 140ms ease, border-color 140ms ease"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.2L5 8.5L9.5 3.5",
    stroke: "#fff",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      color: "var(--color-text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kabrito Input — text/number/email field with optional label & helper.
 * Tight 6px radius (deliberately squarer than the pill CTAs); rose focus ring.
 */
function Input({
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
  const borderColor = error ? "var(--color-secondary)" : focus ? "var(--color-border-focus)" : "var(--color-border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: disabled ? "var(--color-bg-muted)" : "var(--color-bg-surface)",
      border: "1px solid " + borderColor,
      borderRadius: "var(--radius-sm)",
      padding: "9px 12px",
      boxShadow: focus ? "var(--shadow-focus)" : "none",
      transition: "border-color 140ms ease, box-shadow 140ms ease"
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-muted)",
      display: "inline-flex"
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      lineHeight: 1.4,
      color: "var(--color-text-primary)",
      minWidth: 0
    }
  }, rest))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: error ? "var(--color-secondary-hover)" : "var(--color-text-muted)"
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Kabrito Switch — on/off toggle. Forest when on. */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style = {}
}) {
  const switchId = id || (label ? "sw-" + label.replace(/\s+/g, "-").toLowerCase() : undefined);
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    id: switchId,
    type: "button",
    role: "switch",
    "aria-checked": checked,
    onClick: toggle,
    disabled: disabled,
    style: {
      position: "relative",
      width: 42,
      height: 24,
      flexShrink: 0,
      borderRadius: "var(--radius-full)",
      border: "none",
      padding: 0,
      cursor: disabled ? "not-allowed" : "pointer",
      background: checked ? "var(--color-primary)" : "var(--color-border-strong)",
      transition: "background 160ms ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: checked ? 21 : 3,
      width: 18,
      height: 18,
      borderRadius: "var(--radius-full)",
      background: "#fff",
      boxShadow: "var(--shadow-1)",
      transition: "left 160ms cubic-bezier(0.2,0.8,0.2,1)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      color: "var(--color-text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Kabrito Tabs — underline tab strip.
 * items: [{ id, label }]. Controlled via value/onChange.
 */
function Tabs({
  items = [],
  value,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(value || items[0] && items[0].id);
  const active = value !== undefined ? value : internal;
  const select = id => {
    setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      borderBottom: "1px solid var(--color-border-default)",
      ...style
    }
  }, items.map(it => {
    const isActive = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => select(it.id),
      style: {
        position: "relative",
        border: "none",
        background: "transparent",
        padding: "10px 14px 12px",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
        transition: "color 140ms ease"
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: -1,
        height: 2,
        borderRadius: 2,
        background: isActive ? "var(--color-primary)" : "transparent",
        transition: "background 140ms ease"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/app.jsx
try { (() => {
/* Kabrito App — shell + views. Exports window.KApp. Composes DS primitives. */

const Ic = {
  home: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 9.5L12 3l9 6.5V21H3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 21v-7h6v7"
  })),
  calendar: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  })),
  users: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"
  })),
  pen: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
  })),
  card: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "5",
    width: "20",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 10h20"
  })),
  settings: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z"
  })),
  bell: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.73 21a2 2 0 0 1-3.46 0"
  })),
  search: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 18,
    height: p.s || 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4.3-4.3"
  })),
  plus: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 18,
    height: p.s || 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  trend: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 18,
    height: p.s || 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 17l6-6 4 4 8-8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 7h4v4"
  }))
};
const NAV = [{
  id: "inicio",
  label: "Início",
  icon: Ic.home
}, {
  id: "agenda",
  label: "Agenda",
  icon: Ic.calendar
}, {
  id: "clientes",
  label: "Clientes",
  icon: Ic.users
}, {
  id: "conteudos",
  label: "Conteúdos",
  icon: Ic.pen
}, {
  id: "fatura",
  label: "Faturamento",
  icon: Ic.card
}, {
  id: "config",
  label: "Configurações",
  icon: Ic.settings
}];
const TITLES = {
  inicio: "Início",
  agenda: "Agenda",
  clientes: "Clientes",
  conteudos: "Conteúdos",
  fatura: "Faturamento",
  config: "Configurações"
};
function Sidebar({
  active,
  setActive,
  Avatar
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flexShrink: 0,
      background: "var(--color-bg-subtle)",
      borderRight: "1px solid var(--color-border-default)",
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 20px 12px"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-kabrito.svg",
    height: "28",
    alt: "Kabrito"
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: "8px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flex: 1
    }
  }, NAV.map(n => {
    const on = n.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => setActive(n.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "9px 12px",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
        fontSize: 14.5,
        fontWeight: on ? 600 : 500,
        background: on ? "var(--color-primary-soft)" : "transparent",
        color: on ? "var(--color-primary)" : "var(--color-text-secondary)"
      }
    }, /*#__PURE__*/React.createElement(n.icon, {
      s: 19
    }), n.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: "1px solid var(--color-border-default)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Marina Alves",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--color-text-primary)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Marina Alves"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--color-text-muted)"
    }
  }, "Plano Profissional"))));
}
function Topbar({
  title,
  IconButton
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 64,
      flexShrink: 0,
      borderBottom: "1px solid var(--color-border-default)",
      background: "var(--color-bg-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: "-0.4px",
      color: "var(--color-text-primary)",
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-sm)",
      padding: "7px 11px",
      color: "var(--color-text-muted)",
      width: 220
    }
  }, /*#__PURE__*/React.createElement(Ic.search, {
    s: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14
    }
  }, "Buscar\u2026")), /*#__PURE__*/React.createElement(IconButton, {
    ariaLabel: "Notifica\xE7\xF5es",
    variant: "ghost"
  }, /*#__PURE__*/React.createElement(Ic.bell, {
    s: 20
  }))));
}

/* ── Views ── */
function StatCard({
  label,
  value,
  delta
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--color-text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 32,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontFamily: "var(--font-sans)",
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--color-primary)"
    }
  }, /*#__PURE__*/React.createElement(Ic.trend, {
    s: 14
  }), delta)));
}
function ViewInicio({
  Badge
}) {
  const agenda = [{
    t: "Marina Alves",
    s: "Sessão individual",
    h: "09:00",
    st: "confirmado",
    tone: "forest"
  }, {
    t: "Grupo de bem-estar",
    s: "5 participantes",
    h: "11:30",
    st: "confirmado",
    tone: "forest"
  }, {
    t: "João Pedro",
    s: "Primeira conversa",
    h: "14:00",
    st: "aguardando",
    tone: "blush"
  }, {
    t: "Camila Reis",
    s: "Acompanhamento",
    h: "16:30",
    st: "confirmado",
    tone: "forest"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Sess\xF5es esta semana",
    value: "18",
    delta: "+12%"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Clientes ativos",
    value: "42",
    delta: "+3"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Conte\xFAdos publicados",
    value: "7",
    delta: "+2"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px",
      borderBottom: "1px solid var(--color-border-default)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "k-title",
    style: {
      margin: 0
    }
  }, "Agenda de hoje"), /*#__PURE__*/React.createElement("span", {
    className: "k-caption",
    style: {
      color: "var(--color-text-muted)"
    }
  }, "Quinta, 13 jun")), agenda.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "13px 18px",
      borderBottom: i < agenda.length - 1 ? "1px solid var(--color-border-default)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--color-text-muted)",
      width: 44
    }
  }, a.h), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 32,
      borderRadius: 99,
      background: a.tone === "forest" ? "var(--forest-400)" : "var(--blush-400)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, a.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--color-text-muted)"
    }
  }, a.s)), /*#__PURE__*/React.createElement(Badge, {
    tone: a.tone === "forest" ? "success" : "blush"
  }, a.st))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-primary)",
      color: "#fff",
      borderRadius: "var(--radius-lg)",
      padding: 24,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-eyebrow",
    style: {
      color: "var(--color-accent)"
    }
  }, "Editorial da semana"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 26,
      fontWeight: 500,
      margin: "10px 0 8px",
      color: "#fff"
    }
  }, "Respirar \xE9 come\xE7ar de novo"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--mint-200)",
      margin: 0
    }
  }, "Seu texto sobre respira\xE7\xE3o consciente teve 240 leituras esta semana.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-accent-soft)",
      border: "1px solid var(--color-border-accent)",
      borderRadius: "var(--radius-lg)",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "k-title",
    style: {
      margin: "0 0 6px",
      color: "var(--color-text-warm)"
    }
  }, "Um lembrete gentil"), /*#__PURE__*/React.createElement("p", {
    className: "k-body-sm",
    style: {
      color: "var(--color-text-warm)",
      margin: 0
    }
  }, "Voc\xEA tem 2 confirma\xE7\xF5es pendentes para amanh\xE3."))));
}
function ViewClientes({
  Button,
  Badge,
  Avatar,
  Input
}) {
  const rows = [{
    n: "Marina Alves",
    e: "marina@email.com",
    last: "Hoje, 09:00",
    st: "Ativo",
    tone: "success"
  }, {
    n: "João Pedro",
    e: "joao.p@email.com",
    last: "Ontem",
    st: "Novo",
    tone: "blush"
  }, {
    n: "Camila Reis",
    e: "camila.reis@email.com",
    last: "3 dias atrás",
    st: "Ativo",
    tone: "success"
  }, {
    n: "Bruno Costa",
    e: "bruno@email.com",
    last: "1 semana atrás",
    st: "Pausado",
    tone: "neutral"
  }, {
    n: "Helena Dias",
    e: "helena.dias@email.com",
    last: "Hoje, 16:30",
    st: "Ativo",
    tone: "success"
  }, {
    n: "Rafael Lima",
    e: "rafael@email.com",
    last: "2 semanas atrás",
    st: "Pausado",
    tone: "neutral"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Buscar cliente\u2026",
    iconLeft: /*#__PURE__*/React.createElement(Ic.search, {
      s: 16
    })
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement(Ic.plus, {
      s: 17
    })
  }, "Novo cliente")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1.2fr 1fr 80px",
      padding: "11px 18px",
      background: "var(--color-bg-muted)",
      borderBottom: "1px solid var(--color-border-default)"
    }
  }, ["Cliente", "Última sessão", "Status", ""].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "k-eyebrow",
    style: {
      color: "var(--color-text-muted)"
    }
  }, h))), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "2fr 1.2fr 1fr 80px",
      alignItems: "center",
      padding: "13px 18px",
      borderBottom: i < rows.length - 1 ? "1px solid var(--color-border-default)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.n,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, r.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12.5,
      color: "var(--color-text-muted)"
    }
  }, r.e))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--color-text-secondary)"
    }
  }, r.last), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: r.tone
  }, r.st)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      color: "var(--color-text-muted)",
      fontFamily: "var(--font-sans)",
      fontWeight: 700
    }
  }, "\xB7\xB7\xB7")))));
}
function ViewConteudos({
  Badge,
  Button
}) {
  const posts = [{
    t: "Respirar é começar de novo",
    st: "Publicado",
    tone: "success",
    reads: "240 leituras",
    g: "var(--gradient-warm)"
  }, {
    t: "Pequenos rituais de manhã",
    st: "Publicado",
    tone: "success",
    reads: "180 leituras",
    g: "var(--gradient-soft)"
  }, {
    t: "Quando o silêncio acolhe",
    st: "Rascunho",
    tone: "neutral",
    reads: "—",
    g: "var(--gradient-editorial)"
  }, {
    t: "Limites são cuidado",
    st: "Agendado",
    tone: "blush",
    reads: "Publica em 2 dias",
    g: "var(--gradient-warm)"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement(Ic.plus, {
      s: 17
    })
  }, "Novo conte\xFAdo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 18
    }
  }, posts.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 96,
      background: p.g
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "k-heading-3",
    style: {
      margin: 0,
      color: "var(--color-text-primary)"
    }
  }, p.t), /*#__PURE__*/React.createElement(Badge, {
    tone: p.tone
  }, p.st)), /*#__PURE__*/React.createElement("p", {
    className: "k-caption",
    style: {
      color: "var(--color-text-muted)",
      margin: "8px 0 0"
    }
  }, p.reads))))));
}
function Placeholder({
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-bg-surface)",
      border: "1px dashed var(--color-border-strong)",
      borderRadius: "var(--radius-lg)",
      padding: 64,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    className: "k-heading-3",
    style: {
      margin: 0,
      color: "var(--color-text-primary)"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "k-body-sm",
    style: {
      color: "var(--color-text-muted)",
      margin: "8px 0 0"
    }
  }, "Esta \xE1rea faz parte do kit, por\xE9m n\xE3o foi detalhada \u2014 mantida em branco propositalmente."));
}
function AppShell(P) {
  const {
    Button,
    IconButton,
    Card,
    Badge,
    Avatar,
    Input
  } = P;
  const [active, setActive] = React.useState("inicio");
  let view;
  if (active === "inicio") view = /*#__PURE__*/React.createElement(ViewInicio, {
    Badge: Badge
  });else if (active === "clientes") view = /*#__PURE__*/React.createElement(ViewClientes, {
    Button: Button,
    Badge: Badge,
    Avatar: Avatar,
    Input: Input
  });else if (active === "conteudos") view = /*#__PURE__*/React.createElement(ViewConteudos, {
    Badge: Badge,
    Button: Button
  });else view = /*#__PURE__*/React.createElement(Placeholder, {
    title: TITLES[active]
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "var(--color-bg-default)"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    setActive: setActive,
    Avatar: Avatar
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Topbar, {
    title: TITLES[active],
    IconButton: IconButton
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: 28
    }
  }, view)));
}
Object.assign(window, {
  KApp: {
    AppShell
  }
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/marketing.jsx
try { (() => {
/* Kabrito Marketing — shared inline icons + section components.
   Exports to window for index.html to compose. */

const I = {
  Leaf: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 21c0-3 1.85-5.36 5.08-6"
  })),
  Calendar: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  })),
  Pen: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
  })),
  Heart: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 20,
    height: p.s || 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
  })),
  Arrow: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 16,
    height: p.s || 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  })),
  Check: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 16,
    height: p.s || 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6L9 17l-5-5"
  })),
  Star: p => /*#__PURE__*/React.createElement("svg", {
    width: p.s || 16,
    height: p.s || 16,
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.86-5-4.87 7.1-1.01z"
  }))
};
function MarketingNav({
  Button
}) {
  const link = {
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    fontWeight: 500
  };
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(247,250,247,0.82)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--color-border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-kabrito.svg",
    height: "30",
    alt: "Kabrito"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 28,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#recursos",
    style: link
  }, "Recursos"), /*#__PURE__*/React.createElement("a", {
    href: "#precos",
    style: link
  }, "Pre\xE7os"), /*#__PURE__*/React.createElement("a", {
    href: "#sobre",
    style: link
  }, "Sobre")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      ...link,
      color: "var(--color-text-primary)"
    }
  }, "Entrar"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    shape: "pill"
  }, "Criar conta gr\xE1tis"))));
}
function MarketingHero({
  Button,
  Badge
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--gradient-soft)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 28px 80px",
      display: "grid",
      gridTemplateColumns: "1.05fr 0.95fr",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "rose"
  }, /*#__PURE__*/React.createElement(I.Leaf, {
    s: 13
  }), " Para profissionais do cuidado"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 60,
      fontWeight: 500,
      lineHeight: 1.04,
      letterSpacing: "-1.5px",
      color: "var(--color-text-primary)",
      margin: "18px 0 0"
    }
  }, "Sua pr\xE1tica de cuidado, ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "var(--color-secondary)"
    }
  }, "com respiro"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 18,
      lineHeight: 1.6,
      color: "var(--color-text-secondary)",
      margin: "20px 0 0",
      maxWidth: 480
    }
  }, "Kabrito re\xFAne agenda, clientes e conte\xFAdos editoriais em um s\xF3 lugar \u2014 leve, sens\xEDvel e feito para quem cuida de pessoas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 28,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    shape: "pill",
    iconRight: /*#__PURE__*/React.createElement(I.Arrow, null)
  }, "Come\xE7ar agora"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    shape: "pill"
  }, "Ver demonstra\xE7\xE3o")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--color-text-muted)",
      marginTop: 16
    }
  }, "Gr\xE1tis para come\xE7ar \xB7 sem cart\xE3o de cr\xE9dito")), /*#__PURE__*/React.createElement(MockApp, null)));
}
function MockApp() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-2xl)",
      boxShadow: "var(--shadow-3)",
      padding: 18,
      transform: "rotate(0.5deg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 99,
      background: "var(--blush-400)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 99,
      background: "var(--mint-300)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 99,
      background: "var(--forest-300)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--color-text-muted)"
    }
  }, "Agenda de hoje")), [{
    t: "Sessão · Marina Alves",
    h: "09:00",
    c: "var(--forest-100)",
    d: "var(--forest-600)"
  }, {
    t: "Grupo de bem-estar",
    h: "11:30",
    c: "var(--blush-100)",
    d: "var(--blush-700)"
  }, {
    t: "Novo conteúdo: respiração",
    h: "14:00",
    c: "var(--rose-100)",
    d: "var(--rose-600)"
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: "var(--radius-lg)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-default)",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 36,
      borderRadius: 99,
      background: r.d
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      fontWeight: 600,
      color: "var(--color-text-primary)"
    }
  }, r.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      color: "var(--color-text-muted)"
    }
  }, r.h, " \xB7 50 min")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: 99,
      background: r.c,
      color: r.d
    }
  }, "confirmado"))));
}
function MarketingFeatures({
  Card
}) {
  const feats = [{
    icon: /*#__PURE__*/React.createElement(I.Calendar, {
      s: 22
    }),
    t: "Agenda que respira",
    d: "Sessões, lembretes e confirmações automáticas — sem o ruído de uma agenda lotada."
  }, {
    icon: /*#__PURE__*/React.createElement(I.Heart, {
      s: 22
    }),
    t: "Clientes com contexto",
    d: "Histórico, anotações e evolução de cada pessoa, sempre à mão e com privacidade."
  }, {
    icon: /*#__PURE__*/React.createElement(I.Pen, {
      s: 22
    }),
    t: "Conteúdo editorial",
    d: "Publique textos e práticas com a elegância de uma revista — no seu próprio espaço."
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "recursos",
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "88px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 640,
      margin: "0 auto 48px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-eyebrow",
    style: {
      color: "var(--color-secondary)"
    }
  }, "Recursos"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 40,
      fontWeight: 500,
      letterSpacing: "-0.8px",
      color: "var(--color-text-primary)",
      margin: "10px 0 0"
    }
  }, "Tudo o que o cuidado pede, em calma")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 20
    }
  }, feats.map((f, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    variant: "default",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "var(--radius-lg)",
      background: "var(--color-primary-soft)",
      color: "var(--color-primary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, f.icon), /*#__PURE__*/React.createElement("h3", {
    className: "k-heading-3",
    style: {
      margin: "18px 0 8px",
      color: "var(--color-text-primary)"
    }
  }, f.t), /*#__PURE__*/React.createElement("p", {
    className: "k-body-sm",
    style: {
      color: "var(--color-text-secondary)",
      margin: 0
    }
  }, f.d)))));
}
function EditorialBand() {
  return /*#__PURE__*/React.createElement("section", {
    id: "sobre",
    style: {
      background: "var(--color-primary)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: "0 auto",
      padding: "88px 28px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-accent)",
      marginBottom: 18,
      display: "flex",
      justifyContent: "center",
      gap: 4
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(I.Star, {
    key: i,
    s: 18
  }))), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 34,
      fontWeight: 500,
      lineHeight: 1.32,
      letterSpacing: "-0.5px",
      margin: 0
    }
  }, "\u201CPela primeira vez minha agenda e meus textos moram no mesmo lugar \u2014 e tudo ficou mais leve.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 99,
      background: "var(--blush-200)",
      color: "var(--forest-700)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
      fontFamily: "var(--font-sans)"
    }
  }, "CR"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 600
    }
  }, "Camila Reis"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: "var(--mint-300)"
    }
  }, "Psic\xF3loga \xB7 S\xE3o Paulo")))));
}
function MarketingPricing({
  Button,
  Badge
}) {
  const plans = [{
    name: "Essencial",
    price: "R$0",
    per: "para sempre",
    desc: "Para quem está começando.",
    feats: ["Agenda e lembretes", "Até 10 clientes", "1 espaço editorial"],
    cta: "Começar grátis",
    variant: "outline",
    featured: false
  }, {
    name: "Profissional",
    price: "R$49",
    per: "por mês",
    desc: "Para a prática em crescimento.",
    feats: ["Clientes ilimitados", "Confirmações automáticas", "Conteúdo editorial completo", "Relatórios de evolução"],
    cta: "Assinar Profissional",
    variant: "primary",
    featured: true
  }, {
    name: "Estúdio",
    price: "R$129",
    per: "por mês",
    desc: "Para equipes e clínicas.",
    feats: ["Tudo do Profissional", "Até 8 profissionais", "Marca personalizada", "Suporte prioritário"],
    cta: "Falar com a gente",
    variant: "outline",
    featured: false
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "precos",
    style: {
      background: "var(--color-bg-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: "0 auto",
      padding: "88px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 640,
      margin: "0 auto 48px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "k-eyebrow",
    style: {
      color: "var(--color-secondary)"
    }
  }, "Planos"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 40,
      fontWeight: 500,
      letterSpacing: "-0.8px",
      color: "var(--color-text-primary)",
      margin: "10px 0 0"
    }
  }, "Comece leve, cres\xE7a no seu tempo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 20,
      alignItems: "start"
    }
  }, plans.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: p.featured ? "var(--color-bg-surface)" : "var(--color-bg-subtle)",
      border: "1px solid " + (p.featured ? "var(--color-border-focus)" : "var(--color-border-default)"),
      borderRadius: "var(--radius-xl)",
      padding: 28,
      position: "relative",
      boxShadow: p.featured ? "var(--shadow-2)" : "none"
    }
  }, p.featured && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -12,
      left: 28
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "blush"
  }, "Mais popular")), /*#__PURE__*/React.createElement("h3", {
    className: "k-title",
    style: {
      margin: 0,
      color: "var(--color-text-primary)"
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    className: "k-caption",
    style: {
      margin: "4px 0 16px",
      color: "var(--color-text-muted)"
    }
  }, p.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 40,
      fontWeight: 500,
      color: "var(--color-text-primary)"
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    className: "k-caption",
    style: {
      color: "var(--color-text-muted)"
    }
  }, p.per)), /*#__PURE__*/React.createElement(Button, {
    variant: p.variant,
    fullWidth: true,
    shape: "pill"
  }, p.cta), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--color-border-default)",
      margin: "22px 0"
    }
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, p.feats.map((f, j) => /*#__PURE__*/React.createElement("li", {
    key: j,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--color-text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(I.Check, null)), f))))))));
}
function MarketingFooter() {
  const col = (title, items) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "k-eyebrow",
    style: {
      color: "var(--color-text-muted)",
      marginBottom: 14
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--color-text-secondary)",
      textDecoration: "none"
    }
  }, it))));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--color-bg-subtle)",
      borderTop: "1px solid var(--color-border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "56px 28px 40px",
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-kabrito.svg",
    height: "28",
    alt: "Kabrito"
  }), /*#__PURE__*/React.createElement("p", {
    className: "k-body-sm",
    style: {
      color: "var(--color-text-muted)",
      margin: "14px 0 0",
      maxWidth: 240
    }
  }, "O espa\xE7o sens\xEDvel para quem cuida de pessoas.")), col("Produto", ["Recursos", "Preços", "Novidades", "Segurança"]), col("Empresa", ["Sobre", "Blog editorial", "Carreiras", "Contato"]), col("Suporte", ["Central de ajuda", "Comunidade", "Status", "Termos"])), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 28px 40px",
      display: "flex",
      justifyContent: "space-between",
      color: "var(--color-text-muted)",
      fontFamily: "var(--font-sans)",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Kabrito \xB7 feito com cuidado no Brasil"), /*#__PURE__*/React.createElement("span", null, "Privacidade \xB7 Termos")));
}
Object.assign(window, {
  KMarketing: {
    MarketingNav,
    MarketingHero,
    MarketingFeatures,
    EditorialBand,
    MarketingPricing,
    MarketingFooter
  }
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/marketing.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
