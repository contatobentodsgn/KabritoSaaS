import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL. Falls back to initials from `name`. */
  src?: string;
  /** Full name — used for initials and alt text. */
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/** Circular avatar with image or initials fallback. */
export function Avatar(props: AvatarProps): JSX.Element;
