import * as React from "react";

export interface IconButtonProps {
  /** Accessible label — required since there is no visible text. */
  ariaLabel: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  /** rounded (8px) or full circle. @default "rounded" */
  shape?: "rounded" | "circle";
  disabled?: boolean;
  onClick?: () => void;
  /** A single icon glyph (e.g. a Lucide SVG). */
  children?: React.ReactNode;
}

/** Square or circular control hosting one icon glyph. */
export function IconButton(props: IconButtonProps): JSX.Element;
