import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  isVisible,
  onClose,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="bg-white rounded-lg shadow-lg border border-green-200 p-4 max-w-sm"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{message}</p>
                {actionText && onAction && (
                  <div className="mt-3">
                    <button
                      onClick={onAction}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {actionText}
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessNotification;
