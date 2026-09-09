import { cva } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-brand-button hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-transparent text-accent-foreground hover:bg-accent hover:border-accent-border hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0",
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 shrink-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const Button = forwardRef(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
