import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CameraIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onSkip }) => {
  const { completeProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "student",
    profilePicture: "",
  });

  const ROLES = [
    { value: "student", label: "Student", description: "Preparing for interviews" },
    { value: "teacher", label: "Teacher", description: "Teaching/interview prep" },
    { value: "hr", label: "HR Professional", description: "Conducting interviews" },
  ];

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      newErrors.username = "Username must be 3-30 characters (letters, numbers, underscores)";
    }
    if (usernameAvailable === false) {
      newErrors.username = "Username is already taken";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const response = await apiClient.fetch(`/auth/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setUsernameAvailable(data.success && !data.data?.exists);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setFormData((prev) => ({ ...prev, username: normalized }));

    if (usernameTimeout) clearTimeout(usernameTimeout);
    const timeout = setTimeout(() => checkUsernameAvailability(normalized), 500);
    setUsernameTimeout(timeout);
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const result = await completeProfile({
        username: formData.username.toLowerCase(),
        name: formData.name.trim(),
        role: formData.role,
        profilePicture: formData.profilePicture,
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.message || "Failed to complete profile" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50"
        onClick={() => onSkip?.()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-primary-100 text-sm mt-1">Step {step} of 2</p>
            </div>
            <div className="flex space-x-1">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-white" : "bg-primary-400"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-white" : "bg-primary-400"}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Choose a unique username"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {usernameChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      <CheckIcon className="w-5 h-5" />
                    </div>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                      <XMarkIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  3-30 characters, letters, numbers, and underscores only
                </p>
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleNext}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <div className="space-y-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setFormData((prev) => ({ ...prev, role: role.value }))}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        formData.role === role.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Picture (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {formData.profilePicture ? (
                      <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <CameraIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="url"
                      value={formData.profilePicture}
                      onChange={(e) => setFormData((prev) => ({ ...prev, profilePicture: e.target.value }))}
                      placeholder="Paste image URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter an image URL</p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-red-600 text-center">{errors.submit}</p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Completing...
                    </div>
                  ) : (
                    "Complete Profile"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {onSkip && (
          <div className="px-6 pb-4 text-center">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingModal;