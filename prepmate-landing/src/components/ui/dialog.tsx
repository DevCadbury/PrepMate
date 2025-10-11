"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { createPortal } from "react-dom";

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  if (!open) return null;
  return <>{children}</>;
};

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger = ({ children, asChild }: DialogTriggerProps) => {
  return <>{children}</>;
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, open = false, onOpenChange, ...props }, ref) => {
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && onOpenChange) {
        onOpenChange(false);
      }
    };

    const handleCloseClick = () => {
      console.log("X button clicked, calling onOpenChange(false)");
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && onOpenChange) {
        onOpenChange(false);
      }
    };

    // Add event listener for escape key
    React.useEffect(() => {
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open && onOpenChange) {
          onOpenChange(false);
        }
      };

      if (open) {
        document.addEventListener("keydown", handleEscapeKey);
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = "unset";
      };
    }, [open, onOpenChange]);

    const dialogContent = (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        />

        {/* Dialog Content */}
        <div
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg translate-y-0 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
            className
          )}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          {...props}
        >
          {children}
        </div>
      </div>
    );

    // Use portal to render at document body level
    if (typeof document !== "undefined") {
      return createPortal(dialogContent, document.body);
    }

    return dialogContent;
  }
);
DialogContent.displayName = "DialogContent";

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const DialogHeader = ({ children, className, ...props }: DialogHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
DialogHeader.displayName = "DialogHeader";

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight",
          className
        )}
        {...props}
      >
        {children}
      </h2>
    );
  }
);
DialogTitle.displayName = "DialogTitle";

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ children, className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
});
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
};
