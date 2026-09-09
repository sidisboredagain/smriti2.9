import { cva } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        accent: "bg-accent text-accent-foreground border border-accent-border",
        secondary: "bg-secondary/10 text-secondary",
        muted: "bg-muted text-muted-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning border border-warning-soft-border",
        destructive: "bg-destructive-soft text-destructive border border-destructive-soft-border",
        tag: "bg-memory-tag text-memory-tag-foreground",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  }
);

const Badge = forwardRef(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
