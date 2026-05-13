import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "../lib/apiClient";
import { useToast } from "./ui/toast";

interface VerificationDialogProps {
  email: string;
  onVerified: () => Promise<void> | void;
  onClose: () => void;
}

const RESEND_INTERVAL_SECONDS = 60;

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  email,
  onVerified,
  onClose,
}) => {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_INTERVAL_SECONDS);
  const { success, error } = useToast();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp) {
      setStatus("error");
      setMessage("Please enter the verification code.");
      return;
    }

    try {
      setStatus("verifying");
      setMessage(null);
      await apiClient.post("/auth/verify-otp", { email, otp });
      setStatus("success");
      setMessage("Email verified. Finishing sign-in...");
      success("Email verified successfully");
      await onVerified();
      onClose();
    } catch (err: any) {
      setStatus("error");
      const msg = err?.message || "Invalid or expired code.";
      setMessage(msg);
      error("Verification failed", msg);
    }
  };

  const handleResend = async () => {
    try {
      setResendStatus("sending");
      setResendMessage(null);
      await apiClient.post("/auth/resend-otp", { email });
      setResendMessage("Verification link and code sent.");
      setCountdown(RESEND_INTERVAL_SECONDS);
    } catch (err: any) {
      setResendMessage(err?.message || "Unable to resend code.");
    } finally {
      setResendStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-xl font-semibold text-gray-900">Verify your email</h3>
        <p className="mt-2 text-sm text-gray-600">
          We sent a 6-digit code and a verification link to <span className="font-medium">{email}</span>.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">OTP code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {message && (
          <p className={`mt-3 text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleVerify}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            disabled={status === "verifying"}
          >
            {status === "verifying" ? "Verifying..." : "Verify"}
          </button>
          <button
            onClick={handleResend}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200"
            disabled={resendStatus === "sending" || countdown > 0}
          >
            {resendStatus === "sending"
              ? "Sending..."
              : countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend OTP"}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        {resendMessage && (
          <p className="mt-3 text-xs text-gray-600">{resendMessage}</p>
        )}
      </motion.div>
    </div>
  );
};

export default VerificationDialog;
