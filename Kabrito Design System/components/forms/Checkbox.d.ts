import * as React from "react";

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}

/** Boolean checkbox — Black Forest fill with white tick when checked. */
export function Checkbox(props: CheckboxProps): JSX.Element;
