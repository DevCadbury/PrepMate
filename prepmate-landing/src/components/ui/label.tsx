"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = "Label";

export { Label };
