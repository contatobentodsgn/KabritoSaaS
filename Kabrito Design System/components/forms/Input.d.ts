import * as React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  /** Field label rendered above the control. */
  label?: string;
  /** Muted helper text below the field. */
  helper?: string;
  /** Error message — turns border/text rose and overrides helper. */
  error?: string;
  /** Icon node inside the field, leading edge. */
  iconLeft?: React.ReactNode;
  type?: "text" | "email" | "password" | "number" | "search" | "tel" | "url";
  disabled?: boolean;
}

/** Single-line text field with label, helper and rose focus ring. */
export function Input(props: InputProps): JSX.Element;
