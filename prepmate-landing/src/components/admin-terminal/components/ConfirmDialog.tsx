import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  actionText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  variant?: 'default' | 'destructive' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  trigger,
  title,
  description,
  actionText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = () => {
    switch (variant) {
      case 'destructive': return 'bg-[var(--admin-error)] text-white hover:bg-[var(--admin-error)]/90';
      case 'warning': return 'bg-[var(--admin-warning)] text-white hover:bg-[var(--admin-warning)]/90';
      default: return 'bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary)]/90';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[var(--admin-surface-container)] border-[var(--admin-outline)] text-[var(--admin-on-surface)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--admin-on-surface-variant)] leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={isLoading} className="bg-transparent border-[var(--admin-outline)] hover:bg-[var(--admin-surface-container-high)] text-[var(--admin-on-surface)]">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={`border-none ${buttonStyle()}`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
