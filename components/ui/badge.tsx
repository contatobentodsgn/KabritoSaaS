import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        // Tons de marca Kabrito — verde = autoridade, blush/rose = emoção.
        // dark: superfícies claras → forest profundo; texto escuro → claro.
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-mint-200 bg-mint-50 text-forest-700 dark:border-forest-800 dark:bg-forest-900 dark:text-forest-200",
        forest:
          "border-transparent bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-100",
        blush:
          "border-transparent bg-blush-100 text-rose-900 dark:bg-blush-500/20 dark:text-blush-200",
        rose: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-blush-200",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "border-mint-200 text-forest-700 dark:border-forest-700 dark:text-forest-200",
        // Estados (recolorizados para a marca)
        success:
          "border-transparent bg-forest-100 text-forest-700 dark:bg-forest-800 dark:text-forest-100",
        warning:
          "border-transparent bg-blush-100 text-rose-900 dark:bg-blush-500/20 dark:text-blush-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
