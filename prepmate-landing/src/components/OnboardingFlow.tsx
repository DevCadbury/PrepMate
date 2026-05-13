import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/apiClient";

const USERNAME_CACHE_TTL_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 450;

const getDashboardPath = (role?: string) => {
  switch (role) {
    case "teacher":
      return "/teacher-dashboard";
    case "hr":
      return "/hr-dashboard";
    case "admin":
      return "/admin";
    case "support":
      return "/support-dashboard";
    default:
      return "/student-dashboard";
  }
};

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isLoading, loginWithToken } = useAuth();
  const [step, setStep] = useState<"profile" | "username" | "complete">("profile");
  const [onboardingSource, setOnboardingSource] = useState<"email" | "google" | "unknown">("unknown");
  const [loadingState, setLoadingState] = useState(true);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    profilePicture: "",
  });
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

  const usernameCache = useRef(new Map<string, { available: boolean; ts: number }>());
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUseToken = useMemo(() => !!token, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!canUseToken) {
      navigate("/");
      return;
    }

    const loadState = async () => {
      setLoadingState(true);
      try {
        const response = await apiClient.fetch("/auth/onboarding-state", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load onboarding state");
        }

        const onboarding = data.data?.onboarding || {};
        const userData = data.data?.user || {};
        const source = onboarding.source || userData.onboarding?.source || "unknown";
        setOnboardingSource(source);

        if (userData.isProfileComplete || onboarding.step === "complete") {
          navigate(getDashboardPath(userData.role || user?.role));
          return;
        }

        const draft = onboarding.profileDraft || {};
        setProfileData({
          firstName: draft.firstName || userData.profile?.firstName || "",
          lastName: draft.lastName || userData.profile?.lastName || "",
          dateOfBirth: draft.dateOfBirth ? String(draft.dateOfBirth).slice(0, 10) : userData.profile?.dateOfBirth ? String(userData.profile.dateOfBirth).slice(0, 10) : "",
          profilePicture: draft.profilePicture || userData.profilePicture || "",
        });

        setUsername(onboarding.usernameDraft || userData.username || "");

        if (source === "google") {
          setStep("username");
        } else {
          setStep(onboarding.step === "username" ? "username" : "profile");
        }
      } catch (error) {
        console.error("Onboarding state load failed:", error);
      } finally {
        setLoadingState(false);
      }
    };

    loadState();
  }, [canUseToken, isLoading, navigate, token, user?.role]);

  useEffect(() => {
    if (!canUseToken || loadingState) return;

    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
    }

    draftTimer.current = setTimeout(async () => {
      try {
        await apiClient.fetch("/auth/onboarding-state", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step,
            profileDraft: profileData,
            usernameDraft: username,
          }),
        });
      } catch (error) {
        console.warn("Failed to persist onboarding draft:", error);
      }
    }, 700);

    return () => {
      if (draftTimer.current) {
        clearTimeout(draftTimer.current);
      }
    };
  }, [step, profileData, username, canUseToken, loadingState, token]);

  const validateProfile = () => {
    if (onboardingSource === "google") {
      return true;
    }

    const nextErrors: { [key: string]: string } = {};

    if (!profileData.firstName.trim()) {
      nextErrors.firstName = "First name is required";
    }

    if (!profileData.lastName.trim()) {
      nextErrors.lastName = "Last name is required";
    }

    if (!profileData.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(profileData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13 || age > 100) {
        nextErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (onboardingSource === "google") {
      setStep("username");
      return;
    }

    if (!validateProfile()) return;

    setProfileSaving(true);
    try {
      const payload = {
        ...profileData,
        dateOfBirth: profileData.dateOfBirth || null,
      } as Record<string, string | null>;

      if (!profileData.profilePicture) {
        delete payload.profilePicture;
      }

      const response = await apiClient.fetch("/auth/onboarding/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data?.errors?.[0]?.msg || data.message || "Failed to save profile step";
        throw new Error(message);
      }

      setStep("username");
    } catch (error: any) {
      setProfileErrors({ submit: error?.message || "Unable to save profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await apiClient.fetch("/auth/onboarding/upload-profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setProfileData((prev) => ({ ...prev, profilePicture: data.data?.url || "" }));
    } catch (error: any) {
      setProfileErrors({ submit: error?.message || "Unable to upload image" });
    } finally {
      setUploading(false);
    }
  };

  const validateUsernameFormat = (value: string) => {
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 30) return "Username must be at most 30 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return "";
  };

  const checkUsernameAvailability = useCallback(async (value: string) => {
    const formatError = validateUsernameFormat(value);
    if (formatError) {
      setUsernameStatus("invalid");
      setUsernameError(formatError);
      return;
    }

    const cacheEntry = usernameCache.current.get(value);
    if (cacheEntry && Date.now() - cacheEntry.ts < USERNAME_CACHE_TTL_MS) {
      setUsernameStatus(cacheEntry.available ? "available" : "taken");
      setUsernameError(cacheEntry.available ? "" : "Username is already taken");
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    try {
      const response = await apiClient.fetch("/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = await response.json();
      const available = !!data?.data?.available;

      usernameCache.current.set(value, { available, ts: Date.now() });
      setUsernameStatus(available ? "available" : "taken");
      setUsernameError(available ? "" : "Username is already taken");
    } catch (error) {
      setUsernameStatus("invalid");
      setUsernameError("Could not check username availability");
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalized);
    setUsernameStatus("idle");
    setUsernameError("");

    if (usernameTimer.current) {
      clearTimeout(usernameTimer.current);
    }

    if (normalized) {
      usernameTimer.current = setTimeout(() => {
        checkUsernameAvailability(normalized);
      }, DEBOUNCE_MS);
    }
  };

  const handleUsernameSubmit = async () => {
    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setUsernameStatus("invalid");
      setUsernameError(formatError);
      return;
    }

    if (usernameStatus === "taken") {
      setUsernameError("Username is already taken");
      return;
    }

    setUsernameSaving(true);
    try {
      const response = await apiClient.fetch("/auth/onboarding/username", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to complete onboarding");
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        await loginWithToken(data.data.token);
      }

      const role = data.data?.user?.role || user?.role;
      navigate(getDashboardPath(role));
    } catch (error: any) {
      setUsernameError(error?.message || "Unable to complete onboarding");
      setUsernameStatus("invalid");
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleExit = async () => {
    try {
      await apiClient.fetch("/auth/onboarding-state", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step,
          profileDraft: profileData,
          usernameDraft: username,
        }),
      });
    } catch (error) {
      console.warn("Failed to persist onboarding state:", error);
    }

    navigate("/");
  };

  if (loadingState || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isGoogleSignup = onboardingSource === "google";
  const stepLabel = step === "profile" ? "Profile" : "Username";
  const progressPercent = step === "profile" ? 50 : 100;
  const missingProfileFields = Object.entries(profileErrors)
    .filter(([key]) => key !== "submit")
    .map(([key]) => {
      switch (key) {
        case "firstName":
          return "First name";
        case "lastName":
          return "Last name";
        case "dateOfBirth":
          return "Date of birth";
        default:
          return key;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-6 border-b border-slate-200 px-8 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Onboarding</p>
            <h2 className="text-2xl font-semibold text-slate-900 mt-1">
              {isGoogleSignup ? "Choose your username" : "Let’s finish your profile"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isGoogleSignup
                ? "Google signup detected. We just need a unique username to continue."
                : "Add a few details so your account feels personal."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Step {step === "profile" ? 1 : 2} of 2</div>
            <div className="mt-2 h-2 w-36 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              onClick={handleExit}
              className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Save and finish later
            </button>
          </div>
        </div>

        {step === "profile" && !isGoogleSignup && (
          <div className="space-y-6 px-8 py-7">
            {missingProfileFields.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Missing required fields: {missingProfileFields.join(", ")}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className={`block text-xs font-semibold uppercase tracking-[0.18em] ${profileErrors.firstName ? "text-red-600" : "text-slate-500"}`}>
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-slate-400 ${profileErrors.firstName ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}
                />
                {profileErrors.firstName && (
                  <p className="text-xs text-red-600 mt-2">{profileErrors.firstName}</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className={`block text-xs font-semibold uppercase tracking-[0.18em] ${profileErrors.lastName ? "text-red-600" : "text-slate-500"}`}>
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-slate-400 ${profileErrors.lastName ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}
                />
                {profileErrors.lastName && (
                  <p className="text-xs text-red-600 mt-2">{profileErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className={`block text-xs font-semibold uppercase tracking-[0.18em] ${profileErrors.dateOfBirth ? "text-red-600" : "text-slate-500"}`}>
                Date of birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-slate-400 ${profileErrors.dateOfBirth ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}
              />
              {profileErrors.dateOfBirth && (
                <p className="text-xs text-red-600 mt-2">{profileErrors.dateOfBirth}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Profile picture</p>
                  <p className="text-xs text-slate-400 mt-1">Optional - you can add this later.</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600">Optional</span>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                  {profileData.profilePicture ? (
                    <img src={profileData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No photo</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUpload(file);
                      }
                    }}
                    className="text-sm text-slate-600"
                  />
                  {uploading && <p className="text-xs text-slate-500 mt-2">Uploading...</p>}
                </div>
              </div>
            </div>

            {profileErrors.submit && (
              <p className="text-sm text-red-600">{profileErrors.submit}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">Next: pick a username</div>
              <button
                onClick={handleProfileSubmit}
                disabled={profileSaving}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {profileSaving ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {step === "username" && (
          <div className="space-y-6 px-8 py-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Username</p>
                  <p className="text-sm text-slate-600 mt-1">This is how other people find you.</p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">{stepLabel}</span>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-slate-400 ${usernameStatus === "invalid" || usernameStatus === "taken" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}
                  placeholder="your_unique_name"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-slate-400">3-30 characters · letters, numbers, underscores</span>
                  {usernameStatus === "checking" && <span className="text-slate-500">Checking...</span>}
                  {usernameStatus === "available" && <span className="text-emerald-600">Available</span>}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && usernameError && (
                    <span className="text-red-600">{usernameError}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {!isGoogleSignup && (
                <button
                  onClick={() => setStep("profile")}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleUsernameSubmit}
                disabled={usernameSaving}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {usernameSaving ? "Finishing..." : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
