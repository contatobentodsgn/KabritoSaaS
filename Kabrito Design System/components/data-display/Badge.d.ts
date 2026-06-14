import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color tone. @default "neutral" */
  tone?: "neutral" | "forest" | "rose" | "blush" | "success" | "error";
  children?: React.ReactNode;
}

/** Small pill for status, category or eyebrow labels. */
export function Badge(props: BadgeProps): JSX.Element;
