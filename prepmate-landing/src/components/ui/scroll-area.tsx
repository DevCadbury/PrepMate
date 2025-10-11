"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div className="h-full w-full rounded-[inherit] overflow-auto">
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = "ScrollArea";

interface ScrollBarProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ orientation = "vertical", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex touch-none select-none transition-colors",
          orientation === "vertical" &&
            "h-full w-2.5 border-l border-l-transparent p-[1px]",
          orientation === "horizontal" &&
            "h-2.5 flex-col border-t border-t-transparent p-[1px]",
          className
        )}
        {...props}
      >
        <div className="relative flex-1 rounded-full bg-border" />
      </div>
    );
  }
);
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
