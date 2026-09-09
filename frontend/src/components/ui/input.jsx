import { forwardRef } from "react";

import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-[52px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-faint transition-colors outline-none",
      "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-faint transition-colors outline-none resize-y",
      "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Label = forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mb-2 block text-sm font-semibold text-secondary", className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, Textarea, Label };
