import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** Control height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Corner shape — pill for marketing CTAs. @default "rounded" */
  shape?: "rounded" | "pill";
  /** Icon node rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label. */
  iconRight?: React.ReactNode;
  /** Stretch to fill the container width. @default false */
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Primary action primitive for Kabrito.
 *
 * @startingPoint section="Buttons" subtitle="Forest / Blush / outline / ghost action button" viewport="700x200"
 */
export function Button(props: ButtonProps): JSX.Element;
