import { cva } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "../../lib/utils";

const alertVariants = cva("flex items-start gap-3 rounded-2xl border px-5 py-4 text-[15px] leading-relaxed font-medium", {
  variants: {
    variant: {
      success: "bg-success-soft border-success/25 text-success",
      destructive: "bg-destructive-soft border-destructive-soft-border text-destructive",
      warning: "bg-warning-soft border-warning-soft-border text-warning",
      info: "bg-accent border-accent-border text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const Alert = forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="status" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

export { Alert, alertVariants };
