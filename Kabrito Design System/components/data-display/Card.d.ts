import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface treatment. @default "default" */
  variant?: "default" | "elevated" | "highlight" | "editorial";
  /** Interior padding step. @default "lg" */
  padding?: "sm" | "md" | "lg" | "xl";
  /** Lift on hover (for clickable cards). @default false */
  interactive?: boolean;
  children?: React.ReactNode;
}

/**
 * Primary content surface — composes freely via children.
 *
 * @startingPoint section="Surfaces" subtitle="Card surface: default / elevated / highlight / editorial" viewport="700x260"
 */
export function Card(props: CardProps): JSX.Element;
