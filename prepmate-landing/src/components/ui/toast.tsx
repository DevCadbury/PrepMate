import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800 dark:text-green-200";
      case "error":
        return "text-red-800 dark:text-red-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "info":
        return "text-blue-800 dark:text-blue-200";
      default:
        return "text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getBackgroundColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${getTextColor()}`}>{title}</h4>
          {message && (
            <p className={`text-sm mt-1 ${getTextColor()} opacity-80`}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: removeToast,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (title: string, message?: string, duration?: number) =>
    addToast("success", title, message, duration);
  const error = (title: string, message?: string, duration?: number) =>
    addToast("error", title, message, duration);
  const warning = (title: string, message?: string, duration?: number) =>
    addToast("warning", title, message, duration);
  const info = (title: string, message?: string, duration?: number) =>
    addToast("info", title, message, duration);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  };
};
