import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../components/ui/toast";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const response = await apiClient.fetch(
          `/auth/verify-email-token?token=${encodeURIComponent(token)}`,
          { method: "GET" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
        }

        setStatus("success");
        setMessage("Email verified successfully.");
        success("Email verified successfully");

        const requiresProfile = data.data?.requiresProfileCompletion;
        setTimeout(() => {
          navigate(requiresProfile ? "/onboarding" : "/dashboard");
        }, 800);
      } catch (err: any) {
        setStatus("error");
        const msg = err?.message || "Verification failed.";
        setMessage(msg);
        error("Verification failed", msg);
      }
    };

    verify();
  }, [token, navigate, success, error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold">
          {status === "loading" && "Verifying your email"}
          {status === "success" && "Email verified"}
          {status === "error" && "Verification failed"}
        </h2>
        <p className="text-gray-600 mt-2">
          {message || "Please wait while we verify your email."}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
