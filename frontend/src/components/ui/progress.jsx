import { forwardRef } from "react";

import { cn } from "../../lib/utils";

/** Simple determinate progress bar. `value` is 0-100. */
const Progress = forwardRef(({ className, value = 0, trackClassName, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", trackClassName)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-500 ease-out", className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
