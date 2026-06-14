import * as React from "react";

export interface TabItem { id: string; label: string; }

export interface TabsProps {
  items: TabItem[];
  /** Controlled active id. Omit to let the component manage it. */
  value?: string;
  onChange?: (id: string) => void;
}

/** Underline tab strip — Black Forest active indicator. */
export function Tabs(props: TabsProps): JSX.Element;
