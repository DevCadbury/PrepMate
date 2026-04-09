import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OnboardingForm from "./OnboardingForm";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "../lib/apiClient";

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
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
        const googleDataId = searchParams.get("googleDataId");

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
          // Profile incomplete, fetch Google data and show onboarding form
          console.log("Profile incomplete, fetching Google data...");
          if (googleDataId) {
            try {
              const response = await apiClient.fetch(
                `/auth/google-data/${googleDataId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                setGoogleUserData(data.data);
              } else {
                console.error("Failed to fetch Google data");
              }
            } catch (e) {
              console.error("Error fetching Google data:", e);
            }
          }
          setShowOnboarding(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Google auth callback error:", error);
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, loginWithToken]);

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      const response = await apiClient.fetch(
        "/auth/complete-google-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(onboardingData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update token with new one
        localStorage.setItem("token", data.data.token);

        // Login with updated user data
        await loginWithToken(data.data.token);

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert(`Failed to complete profile: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error completing profile:", error);
      alert("Failed to complete profile. Please try again.");
    }
  };

  const handleOnboardingSkip = () => {
    // Redirect to dashboard even with incomplete profile
    navigate("/dashboard");
  };

  if (showOnboarding) {
    return (
      <OnboardingForm
        googleUserData={googleUserData}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

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
