import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Prevent multiple calls
      if (hasProcessed.current) {
        console.log("Google callback already processed, skipping...");
        return;
      }

      hasProcessed.current = true;

      try {
        console.log("Processing Google OAuth callback...");
        const token = searchParams.get("token");
        const profileComplete = searchParams.get("profileComplete");
        if (!token) {
          setError("No authentication token received");
          setLoading(false);
          return;
        }

        // Store the token
        localStorage.setItem("token", token);

        if (profileComplete === "true") {
          // Profile is complete, login and redirect to dashboard
          console.log("Profile complete, logging in and redirecting...");
          await loginWithToken(token);
          navigate("/dashboard");
        } else {
          // Profile incomplete, redirect to onboarding flow
          console.log("Profile incomplete, redirecting to onboarding...");
          navigate("/onboarding");
        }
      } catch (error) {
        console.error("Google auth callback error:", error);
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, loginWithToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Authentication
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default GoogleAuthCallback;
