import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { apiClient } from "../lib/apiClient";

interface ProfileCompletionProps {
  email: string;
  token: string;
  onProfileComplete: (userData: {
    token: string;
    user: any;
  }) => void;
  onCancel: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  email,
  token,
  onProfileComplete,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    middleName: "",
    dateOfBirth: "",
    role: "student" as "student" | "teacher" | "hr",
  });
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameError, setUsernameError] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Validate username format
  const validateUsernameFormat = (username: string) => {
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 30) {
      return "Username must be at most 30 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return "";
  };

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      const formatError = validateUsernameFormat(username);
      if (formatError) {
        setUsernameStatus("invalid");
        setUsernameError(formatError);
        return;
      }

      setUsernameStatus("checking");
      try {
        const response = await apiClient.fetch(
          `/auth/check-username?username=${encodeURIComponent(username)}`,
          {
            method: "GET",
          }
        );
        const data = await response.json();

        if (data.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(data.reason || "Username is already taken");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameStatus("idle");
        setUsernameError("Could not check username availability");
      }
    },
    []
  );

  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    setFormData((prev) => ({ ...prev, username: lowercaseValue }));

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced check
    if (lowercaseValue.trim()) {
      debounceTimer.current = setTimeout(() => {
        checkUsernameAvailability(lowercaseValue);
      }, 500);
    } else {
      setUsernameStatus("idle");
      setUsernameError("");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (usernameStatus !== "available") {
      newErrors.username = "Please choose an available username";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13 || age > 100) {
        newErrors.dateOfBirth = "You must be between 13 and 100 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let profilePictureUrl: string | undefined = undefined;
      if (profileFile) {
        const formData = new FormData();
        formData.append("file", profileFile);
        formData.append("email", email);
        formData.append("token", token);

        const uploadResponse = await apiClient.fetch("/auth/upload-profile-picture", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Profile picture upload failed");
        }

        profilePictureUrl = uploadData.data?.url;
      }

      const response = await apiClient.fetch("/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          username: formData.username,
          firstName: formData.firstName,
          middleName: formData.middleName,
          dateOfBirth: formData.dateOfBirth || null,
          role: formData.role,
          profilePicture: profilePictureUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onProfileComplete({
          token: data.data.token,
          user: data.data.user,
        });
      } else {
        setErrors({
          submit:
            data.message || "Failed to complete profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Profile completion error:", error);
      setErrors({
        submit: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">Let's set up your account</p>
        </div>

        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center mb-3">
            {profilePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">No photo</div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setProfileFile(file);
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setProfilePreview(String(reader.result || ""));
                reader.readAsDataURL(file);
              } else {
                setProfilePreview("");
              }
            }}
            className="text-sm text-gray-600"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name (optional)
            </label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  middleName: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your middle name"
            />
          </div>

          {/* Username with Availability Check */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username
                    ? "border-red-500"
                    : usernameStatus === "available"
                    ? "border-green-500"
                    : usernameStatus === "taken" || usernameStatus === "invalid"
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Choose a username"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2Icon className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
                {(usernameStatus === "taken" ||
                  usernameStatus === "invalid") && (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-sm text-green-600">
                ✓ Username is available!
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth (optional)
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value,
                }))
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.dateOfBirth ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a *
            </label>
            <div className="space-y-2">
              {["student", "teacher", "hr"].map((r) => (
                <label key={r} className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={formData.role === r}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as
                          | "student"
                          | "teacher"
                          | "hr",
                      }))
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {r === "hr" ? "HR Professional" : r}
                  </span>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus !== "available"}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              )}
              Complete Setup
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileCompletion;
