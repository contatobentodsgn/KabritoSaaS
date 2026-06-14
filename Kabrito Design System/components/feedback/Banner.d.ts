import * as React from "react";

export interface BannerProps {
  /** Status tone → maps to state tokens. @default "info" */
  tone?: "success" | "error" | "warning" | "info";
  /** Bold heading line. */
  title?: string;
  /** Leading icon glyph. */
  icon?: React.ReactNode;
  /** Show a dismiss button when provided. */
  onClose?: () => void;
  children?: React.ReactNode;
}

/** Inline status / alert message built from the state tokens. */
export function Banner(props: BannerProps): JSX.Element;
