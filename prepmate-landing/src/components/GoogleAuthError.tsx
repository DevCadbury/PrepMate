import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";

const GoogleAuthError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Failed
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't complete your Google sign-in. This might be due to a
          temporary issue or you may have cancelled the sign-in process.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleAuthError;
