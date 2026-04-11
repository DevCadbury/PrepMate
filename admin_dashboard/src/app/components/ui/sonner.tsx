import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--popover)] group-[.toaster]:text-[var(--popover-foreground)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-[var(--muted-foreground)]",
          actionButton:
            "group-[.toast]:bg-[var(--primary)] group-[.toast]:text-[var(--primary-foreground)]",
          cancelButton:
            "group-[.toast]:bg-[var(--muted)] group-[.toast]:text-[var(--muted-foreground)]",
          success: "group-[.toaster]:!border-emerald-200 dark:group-[.toaster]:!border-emerald-800",
          error: "group-[.toaster]:!border-red-200 dark:group-[.toaster]:!border-red-800",
          warning: "group-[.toaster]:!border-amber-200 dark:group-[.toaster]:!border-amber-800",
          info: "group-[.toaster]:!border-sky-200 dark:group-[.toaster]:!border-sky-800",
        },
      }}
      position="bottom-right"
      richColors={false}
      closeButton
      duration={4000}
      {...props}
    />
  );
};

export { Toaster };
