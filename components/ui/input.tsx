import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Fields stay tight at 6px (rounded-sm) — squarer than pills. Rose focus ring.
          // text-base no mobile evita o zoom automático do iOS Safari ao focar (<16px); sm:text-sm volta ao tamanho de design.
          "flex h-10 w-full rounded-sm border border-input bg-card px-3 py-2 text-base transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-rose-400 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm dark:focus-visible:border-rose-500 dark:focus-visible:ring-rose-500/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
