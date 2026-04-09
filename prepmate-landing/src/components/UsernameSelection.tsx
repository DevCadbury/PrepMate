import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";

const UsernameSelection: React.FC = () => {
  const { updateProfile } = useAuth();
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      // Redirect to home if no token
      window.location.href = "/";
    }
  }, []);

  const validateUsername = (value: string) => {
    if (!value) {
      return "Username is required";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 30) {
      return "Username must be less than 30 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  };

  const checkUsernameAvailability = async (value: string) => {
    if (!value || validateUsername(value)) return;

    setIsChecking(true);
    try {
      const response = await apiClient.fetch(
        "/auth/check-username",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: value }),
        }
      );

      const data = await response.json();
      setIsAvailable(data.available);
    } catch (error) {
      console.error("Error checking username:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setErrors({ username: validationError });
      return;
    }

    if (isAvailable === false) {
      setErrors({ username: "Username is already taken" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.fetch(
        "/auth/set-username",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update the user context with the new username
        await updateProfile({ username: data.data.user.username });

        // Store the updated token
        localStorage.setItem("token", token);

        // Redirect to dashboard
        window.location.href = "/student-dashboard";
      } else {
        setErrors({ username: data.message || "Failed to set username" });
      }
    } catch (error) {
      console.error("Error setting username:", error);
      setErrors({ username: "Failed to set username. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Choose Your Username
            </CardTitle>
            <CardDescription>
              Welcome! Please choose a unique username for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors({});
                      setIsAvailable(null);
                    }}
                    className={`pr-10 ${
                      errors.username ? "border-red-500" : ""
                    }`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isChecking && (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
                    )}
                    {!isChecking && isAvailable === true && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    {!isChecking && isAvailable === false && (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
                {isAvailable === true && (
                  <p className="mt-1 text-sm text-green-600">
                    Username is available!
                  </p>
                )}
                {isAvailable === false && (
                  <p className="mt-1 text-sm text-red-600">
                    Username is already taken
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isAvailable === false || !username}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Setting username...
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>

            <div className="mt-4 text-xs text-gray-500">
              <p>• Username must be 3-30 characters long</p>
              <p>• Can only contain letters, numbers, and underscores</p>
              <p>• Must be unique across all users</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UsernameSelection;
