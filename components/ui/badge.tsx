import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        // Tons de marca Kabrito — verde = autoridade, blush/rose = emoção.
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-mint-200 bg-mint-50 text-forest-700",
        forest: "border-transparent bg-forest-100 text-forest-700",
        blush: "border-transparent bg-blush-100 text-rose-900",
        rose: "border-rose-200 bg-rose-50 text-rose-900",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-mint-200 text-forest-700",
        // Estados (recolorizados para a marca)
        success: "border-transparent bg-forest-100 text-forest-700",
        warning: "border-transparent bg-blush-100 text-rose-900",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
