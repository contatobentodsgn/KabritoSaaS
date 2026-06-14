import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Optional trailing label. */
  label?: string;
}

/** On/off toggle — Black Forest track when active. */
export function Switch(props: SwitchProps): JSX.Element;
