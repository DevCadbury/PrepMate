import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";
import VerificationDialog from "./VerificationDialog";

interface SignInModalProps {
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ onClose, onSwitchToSignUp }) => {
  const {
    login,
    verificationEmail,
    pendingCredentials,
    clearVerificationState,
  } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier) {
      newErrors.identifier = "Email or username is required";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(identifier);

      if (!isEmail && !isUsername) {
        newErrors.identifier = "Please enter a valid email or username";
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setServerError(null);
    try {
      const result = await login(identifier, password);

      if (result?.requiresVerification) {
        setServerError("Email not verified. Please verify to continue.");
        setShowVerificationDialog(true);
        return;
      }

      // Close modal
      onClose();

      // Redirect to appropriate dashboard based on role
      setTimeout(() => {
        window.location.href = "/student-dashboard";
      }, 1000);
    } catch (error) {
      console.error("Sign in error:", error);
      setErrors({ password: "Invalid email/username or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = apiClient.getApiUrl("/auth/google");
  };

  const handleForgotPassword = async () => {
    setForgotMessage("");
    setForgotError("");

    const email = forgotEmail.trim();
    if (!email) {
      setForgotError("Please enter your email address");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await apiClient.fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setForgotMessage(
          data.message || "Password reset link sent. Please check your email."
        );
      } else {
        setForgotError(data.message || "Could not send reset email");
      }
    } catch (error) {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="signin-identifier"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email or Username
                  </label>
                  <input
                    type="text"
                    id="signin-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.identifier ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email or username"
                  />
                  {errors.identifier && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.identifier}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotForm((prev) => !prev);
                      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
                        setForgotEmail(identifier);
                      }
                      setForgotMessage("");
                      setForgotError("");
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {showForgotForm && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                    <label
                      htmlFor="forgot-email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Reset email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your account email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {forgotError && (
                      <p className="text-sm text-red-600">{forgotError}</p>
                    )}
                    {forgotMessage && (
                      <p className="text-sm text-green-600">{forgotMessage}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="w-full bg-gray-900 text-white py-2 px-3 rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {forgotLoading ? "Sending reset link..." : "Send reset link"}
                    </button>
                  </div>
                )}

                {showVerificationDialog && serverError && (
                  <VerificationDialog
                    email={verificationEmail || identifier}
                    onVerified={async () => {
                      if (pendingCredentials) {
                        await login(
                          pendingCredentials.identifier,
                          pendingCredentials.password
                        );
                      }
                      clearVerificationState();
                    }}
                    onClose={() => {
                      setShowVerificationDialog(false);
                      clearVerificationState();
                    }}
                  />
                )}

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToSignUp();
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign up and start free
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SignInModal;
