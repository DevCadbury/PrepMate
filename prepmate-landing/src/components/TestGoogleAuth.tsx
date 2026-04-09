import React, { useState } from "react";
import { Button } from "./ui/button";
import { apiClient } from "../lib/apiClient";

const TestGoogleAuth: React.FC = () => {
  const [status, setStatus] = useState<string>("");

  const handleGoogleSignIn = () => {
    setStatus("Redirecting to Google OAuth...");
    console.log("Starting Google OAuth flow...");
    window.location.href = apiClient.getApiUrl("/auth/google");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Test Google OAuth
        </h1>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Click "Sign in with Google" below</li>
            <li>2. You'll be redirected to Google for authentication</li>
            <li>3. After Google authentication, you'll be redirected back</li>
            <li>4. If it's a new user, you'll see the onboarding form</li>
            <li>5. Complete the onboarding form to finish the process</li>
          </ol>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
        >
          Sign in with Google
        </Button>

        {status && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">{status}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500 text-center">
          <p className="font-semibold mb-2">Expected Flow:</p>
          <p>Google OAuth → Callback → Onboarding → Dashboard</p>
          <p className="mt-2 text-xs">
            Check browser console and backend logs for debugging info
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestGoogleAuth;
