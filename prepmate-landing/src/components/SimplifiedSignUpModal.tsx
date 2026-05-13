import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useToast } from "./ui/toast";
import { useAuth } from "../contexts/AuthContext";

interface SimplifiedSignUpModalProps {
  onClose?: () => void;
  onSignupSuccess?: (email: string) => void;
}

const SimplifiedSignUpModal: React.FC<SimplifiedSignUpModalProps> = ({
  onClose,
  onSignupSuccess,
}) => {
  const { success, error: showError } = useToast();
  const { register, verifySignupOtp } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // OTP verification state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Timer for resend countdown
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((p) => p - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
      });

      if (result.ok) {
        success("Check your email", `Verification code sent to ${formData.email}`);
        setOtpStep(true);
        setResendCountdown(60);
        onSignupSuccess?.(formData.email);
      } else {
        showError("Signup failed", result.data?.message || "Please try again.");
        setErrors({ email: result.data?.message || "" });
      }
    } catch (err) {
      console.error("Signup error:", err);
      showError("Network error", "Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    setOtpStatus("idle");
    setOtpMessage(null);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpStatus("error");
      setOtpMessage("Please enter the 6-digit code");
      return;
    }

    setOtpStatus("verifying");
    setOtpMessage(null);

    const result = await verifySignupOtp(formData.email, otp);

    if (result.success && result.data?.data?.requiresProfileCompletion) {
      setOtpStatus("success");
      setOtpMessage("Email verified! Continuing to profile setup...");
      setTimeout(() => {
        onClose?.();
        window.location.href = "/onboarding";
      }, 1000);
    } else {
      setOtpStatus("error");
      setOtpMessage(result.data?.message || result.data?.data?.message || "Invalid or expired code");
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    try {
      await register({ email: formData.email, password: formData.password });
      setResendCountdown(60);
      setOtpMessage("New verification code sent!");
    } catch {
      setOtpMessage("Failed to resend. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => onClose?.()}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto mx-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {otpStep ? "Verify Your Email" : "Create Account"}
              </h2>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!otpStep ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      At least 8 chars with uppercase, lowercase, and number
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.confirmPassword ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              ) : (
                /* OTP Verification Step */
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    We sent a 6-digit code to<br />
                    <span className="font-medium text-gray-900">{formData.email}</span>
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className={`w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        otpStatus === "error" ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>

                  {otpMessage && (
                    <p className={`text-sm text-center ${otpStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                      {otpMessage}
                    </p>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpStatus === "verifying" || otp.length !== 6}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {otpStatus === "verifying" ? "Verifying..." : "Verify & Continue"}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0}
                      className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Didn't get the code? Resend"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setOtpStep(false);
                      setOtp("");
                      setOtpStatus("idle");
                      setOtpMessage(null);
                    }}
                    className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
                  >
                    Use a different email
                  </button>
                </div>
              )}

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
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

export default SimplifiedSignUpModal;