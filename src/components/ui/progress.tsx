"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  indeterminate?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indeterminate, ...props }, ref) => {
  // If value is 0 or indeterminate is explicitly true, show indeterminate state
  const showIndeterminate = indeterminate || value === 0;
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted/30",
        className
      )}
      {...props}
    >
      {showIndeterminate ? (
        // Gray gradient for indeterminate/zero progress
        <div className="h-full w-full animate-progress-indeterminate bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
      ) : (
        // Yellow gradient for actual progress
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-gradient-to-r from-yellow-500/40 via-yellow-500/70 to-yellow-500 transition-all duration-300"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
