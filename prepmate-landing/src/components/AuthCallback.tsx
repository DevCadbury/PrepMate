import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userData = urlParams.get("userData");
    const error = urlParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("Authentication failed. Please try again.");
      return;
    }

    if (token) {
      // Store the token in localStorage
      localStorage.setItem("authToken", token);

      // Store user data if provided
      if (userData) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem("userData", JSON.stringify(parsedUserData));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      setStatus("success");
      setMessage("Authentication successful! Redirecting...");

      // Redirect to appropriate dashboard based on role
      setTimeout(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const role = userData.role || "student";
        window.location.href = `/${role}-dashboard`;
      }, 2000);
    } else {
      setStatus("error");
      setMessage("No authentication token received.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
      >
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authenticating...
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your authentication.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to PrepMate!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Go Back Home
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
