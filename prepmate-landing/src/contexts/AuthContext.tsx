import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { apiClient } from "../lib/apiClient";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: "student" | "teacher" | "hr" | "admin" | "support";
  adminRole?: "superadmin" | "moderator" | "support_admin" | "analytics_admin" | null;
  permissions?: string[];
  subscription?: "free" | "basic" | "premium" | "enterprise";
  emailVerified: boolean;
  isProfileComplete?: boolean;
  profilePicture: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    company?: string;
    position?: string;
    experience?: string;
    skills?: string[];
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      year: number;
    }>;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      portfolio?: string;
    };
  };
  preferences?: {
    account?: {
      twoFactorEnabled?: boolean;
      sessionTimeout?: number;
      language?: string;
      theme?: "light" | "dark" | "system";
      timezone?: string;
      loginNotifications?: boolean;
      autoSaveDrafts?: boolean;
    };
    privacy?: {
      profileVisibility?: "public" | "private" | "friends";
      showFollowers?: "public" | "friends" | "private";
      showFollowing?: "public" | "friends" | "private";
      showPosts?: "public" | "friends" | "private";
      showLikes?: boolean;
      allowMessages?: "everyone" | "friends" | "none";
      allowComments?: "everyone" | "friends" | "none";
      showOnlineStatus?: boolean;
      showLastSeen?: boolean;
      showEmail?: boolean;
      showPhone?: boolean;
      defaultPostVisibility?: "public" | "friends" | "private";
      allowLinking?: boolean;
      showLinkCount?: boolean;
    };
    notifications?: {
      newFollowers?: boolean;
      newLikes?: boolean;
      newComments?: boolean;
      mentions?: boolean;
      achievements?: boolean;
    };
  };
  progress?: {
    completedRoadmaps?: string[];
    completedTests?: string[];
    completedInterviews?: string[];
    totalStudyTime?: number;
    streakDays?: number;
    lastStudyDate?: string;
    questionsSolved?: number;
    mockInterviewsCompleted?: number;
    averageScore?: number;
  };
  metrics?: {
    totalPosts?: number;
    totalComments?: number;
    totalLikes?: number;
    profileViews?: number;
    lastProfileView?: string;
  };
  onboarding?: {
    status?: string;
    step?: string;
    source?: string;
    profileDraft?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      profilePicture?: string;
    };
    usernameDraft?: string;
    updatedAt?: string;
  };
  followers?: User[];
  following?: User[];
  followRequests?: User[];
  pendingFollowRequests?: string[];
  blockedUsers?: string[];
  blockedBy?: string[];
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresVerification: boolean;
  verificationEmail: string | null;
  pendingCredentials: { identifier: string; password: string } | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ requiresVerification?: boolean }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; data?: any }>;
  loginWithToken: (token: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ ok: boolean; data: any; requiresVerification?: boolean }>;
  verifySignupOtp: (email: string, otp: string) => Promise<{ success: boolean; data?: any }>;
  completeProfile: (profileData: { username: string; name: string; role?: string; profilePicture?: string }) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  clearVerificationState: () => void;
}

interface RegisterData {
  name?: string;
  email: string;
  password: string;
}

// Action types
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_VERIFICATION_REQUIRED"; payload: { email: string; identifier: string; password: string } }
  | { type: "CLEAR_VERIFICATION" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"), // Set to true if token exists
  isLoading: true,
  error: null,
  requiresVerification: false,
  verificationEmail: null,
  pendingCredentials: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        requiresVerification: false,
        verificationEmail: null,
        pendingCredentials: null,
      };
    case "AUTH_VERIFICATION_REQUIRED":
      return {
        ...state,
        isLoading: false,
        error: null,
        requiresVerification: true,
        verificationEmail: action.payload.email,
        pendingCredentials: {
          identifier: action.payload.identifier,
          password: action.payload.password,
        },
      };
    case "CLEAR_VERIFICATION":
      return {
        ...state,
        requiresVerification: false,
        verificationEmail: null,
        pendingCredentials: null,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await apiClient.fetch(`/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: data.data.user, token },
            });
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("token");
            dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
          }
        } catch (error) {
          console.error("Auth check error:", error);
          localStorage.removeItem("token");
          dispatch({ type: "AUTH_FAILURE", payload: "Authentication failed" });
        }
      } else {
        // No token found, set loading to false immediately
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (identifier: string, password: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await apiClient.fetch(`/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.data?.requiresVerification) {
          dispatch({
            type: "AUTH_VERIFICATION_REQUIRED",
            payload: { email: data?.data?.email || identifier, identifier, password },
          });
          return { requiresVerification: true };
        }

        localStorage.setItem("token", data.data.token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.data.user, token: data.data.token },
        });
        return {};
      }

      // Attach server response to thrown error for UI handling
      const error: any = new Error(data.message || "Login failed");
      error.status = response.status;
      error.data = data;
      throw error;
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: (error as any).message || "Network error" });
      throw error;
    }
  }, []);

  // Login with token function (for OAuth)
  const loginWithToken = useCallback(async (token: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await apiClient.fetch(`/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.data.user, token },
        });
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Token validation failed",
        });
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "Network error" });
    }
  }, []);

  // Register function - starts signup process (creates pending signup, sends OTP)
  const register = async (userData: RegisterData) => {
    dispatch({ type: "AUTH_START" });

    try {
      // Use start-signup endpoint (doesn't create user yet)
      const response = await apiClient.fetch(`/auth/start-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.password, // Backend validates match
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.data?.requiresVerification) {
          dispatch({
            type: "AUTH_VERIFICATION_REQUIRED",
            payload: {
              email: data?.data?.email || userData.email,
              identifier: userData.email,
              password: userData.password,
            },
          });
          return { ok: true, data, requiresVerification: true };
        }

        return { ok: true, data };
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Registration failed",
        });
        return { ok: false, data };
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "Network error" });
      return { ok: false, data: { message: "Network error" } };
    }
  };

  // Verify signup OTP and create account
  const verifySignupOtp = async (email: string, otp: string) => {
    try {
      const response = await apiClient.fetch(`/auth/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after successful verification
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user: {
                id: data.data.email,
                email: data.data.email,
                name: "",
                role: "student" as const,
                emailVerified: true,
                isProfileComplete: false,
                profilePicture: "",
                onboarding: data.data?.onboarding,
              },
              token: data.data.token,
            },
          });
        }
        return { success: true, data };
      }

      return { success: false, data };
    } catch (error) {
      return { success: false, data: { message: "Network error" } };
    }
  };

  // Complete profile after email verification
  const completeProfile = async (profileData: {
    username: string;
    name: string;
    role?: string;
    profilePicture?: string;
  }) => {
    if (!state.token) return { success: false, message: "Not authenticated" };

    try {
      const response = await apiClient.fetch(`/auth/complete-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
        }
        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: data.data?.user || state.user!,
            token: data.data?.token || state.token!,
          },
        });
        return { success: true, data };
      }

      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  };

  // Resend verification helper (OTP + link)
  const resendVerification = useCallback(async (email: string) => {
    try {
      const response = await apiClient.fetch(`/auth/send-verification-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, data: data.data };
    } catch (err) {
      return { success: false, message: "Network error" };
    }
  }, []);

  const clearVerificationState = useCallback(() => {
    dispatch({ type: "CLEAR_VERIFICATION" });
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log("=== LOGOUT FUNCTION CALLED ===");
    console.log("Current state:", {
      isAuthenticated: state.isAuthenticated,
      hasToken: !!state.token,
    });

    try {
      // Call logout endpoint to revoke token
      if (state.token) {
        console.log("Calling logout API to revoke token...");
        const response = await apiClient.fetch(`/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Logout API call failed:", response.status);
          // Even if API fails, we should still logout locally
        } else {
          console.log("Logout API call successful - token revoked");
        }
      } else {
        console.log("No token found, skipping API call");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, we should still logout locally
    } finally {
      // Always clear local state regardless of API call success
      console.log("Clearing local storage and state...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Clear any other auth-related data
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authData");

      // Dispatch logout action
      dispatch({ type: "LOGOUT" });
      console.log("Logout complete - all local data cleared");
    }
  }, [state.token, state.isAuthenticated]);

  // Update profile function
  const updateProfile = async (profileData: Partial<User>) => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(`/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_USER", payload: data.data.user });
      } else {
        throw new Error(data.message || "Profile update failed");
      }
    } catch (error) {
      throw error;
    }
  };

  // Follow user function
  const followUser = async (userId: string) => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(
        `/social/users/${userId}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update current user's following list
        if (state.user) {
          const updatedUser = {
            ...state.user,
            following: [...(state.user.following || []), data.data.user],
          };
          dispatch({ type: "UPDATE_USER", payload: updatedUser });
        }
      } else {
        throw new Error(data.message || "Failed to follow user");
      }
    } catch (error) {
      throw error;
    }
  };

  // Unfollow user function
  const unfollowUser = async (userId: string) => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(
        `/social/users/${userId}/unfollow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update current user's following list
        if (state.user) {
          const updatedUser = {
            ...state.user,
            following: (state.user.following || []).filter(
              (user) => user.id !== userId
            ),
          };
          dispatch({ type: "UPDATE_USER", payload: updatedUser });
        }
      } else {
        throw new Error(data.message || "Failed to unfollow user");
      }
    } catch (error) {
      throw error;
    }
  };

  // Block user function
  const blockUser = async (userId: string) => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(
        `/social/users/${userId}/block`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update current user's blocked users list
        if (state.user) {
          const updatedUser = {
            ...state.user,
            blockedUsers: [...(state.user.blockedUsers || []), userId],
          };
          dispatch({ type: "UPDATE_USER", payload: updatedUser });
        }
      } else {
        throw new Error(data.message || "Failed to block user");
      }
    } catch (error) {
      throw error;
    }
  };

  // Unblock user function
  const unblockUser = async (userId: string) => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(
        `/social/users/${userId}/unblock`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update current user's blocked users list
        if (state.user) {
          const updatedUser = {
            ...state.user,
            blockedUsers: (state.user.blockedUsers || []).filter(
              (id: string) => id !== userId
            ),
          };
          dispatch({ type: "UPDATE_USER", payload: updatedUser });
        }
      } else {
        throw new Error(data.message || "Failed to unblock user");
      }
    } catch (error) {
      throw error;
    }
  };

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.token) return;

    try {
      const response = await apiClient.fetch(`/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.data.token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: state.user!, token: data.data.token },
        });
      } else {
        // Token refresh failed, logout user
        logout();
      }
    } catch (error) {
      // Network error, logout user
      logout();
    }
  }, [state.token, state.user, logout]);

  const value: AuthContextType = {
    ...state,
    login,
    resendVerification,
    loginWithToken,
    register,
    verifySignupOtp,
    completeProfile,
    logout,
    updateProfile,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    clearError,
    refreshToken,
    clearVerificationState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
