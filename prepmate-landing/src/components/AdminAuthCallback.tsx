import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const AdminAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const userData = searchParams.get("userData");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true" && token && userData) {
      try {
        // Store admin token and user data
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminData", userData);

        setStatus("success");
        setMessage(
          "Admin authentication successful! Redirecting to dashboard..."
        );

        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          navigate("/modern-admin-dashboard");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage("Failed to process authentication data");
      }
    } else {
      setStatus("error");
      setMessage(error || "Authentication failed");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-xl max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
        >
          {status === "loading" && (
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          )}
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">
          {status === "loading" && "Processing Authentication..."}
          {status === "success" && "Authentication Successful"}
          {status === "error" && "Authentication Failed"}
        </h2>

        <p className="text-gray-400 mb-6">
          {status === "loading" &&
            "Please wait while we verify your admin credentials..."}
          {status === "success" && message}
          {status === "error" && message}
        </p>

        {status === "error" && (
          <motion.button
            onClick={() => navigate("/admin")}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Admin Login
          </motion.button>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <ShieldCheckIcon className="w-5 h-5" />
            <span className="text-sm">Verifying admin privileges...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminAuthCallback;
