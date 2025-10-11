import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: "student" | "teacher" | "hr" | "admin" | "support";
  subscription?: "free" | "basic" | "premium" | "enterprise";
  emailVerified: boolean;
  profilePicture: string;
  profile?: {
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
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
  role?: "student" | "teacher" | "hr";
}

// Action types
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
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

// API base URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("=== CHECKING AUTH ON MOUNT ===");
      const token = localStorage.getItem("token");
      console.log("Token found:", !!token);

      if (token) {
        try {
          console.log("Validating token with API...");
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(
              "Token valid, user authenticated:",
              data.data.user.name
            );
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: data.data.user, token },
            });
          } else {
            console.log("Token invalid, removing from localStorage");
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
        console.log("No token found, setting loading to false");
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.data.token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.data.user, token: data.data.token },
        });
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Login failed",
        });
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "Network error" });
    }
  }, []);

  // Login with token function (for OAuth)
  const loginWithToken = useCallback(async (token: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
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

  // Register function
  const register = async (userData: RegisterData) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.data.token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.data.user, token: data.data.token },
        });
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: data.message || "Registration failed",
        });
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: "Network error" });
    }
  };

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
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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
      const response = await fetch(
        `${API_BASE_URL}/social/users/${userId}/follow`,
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
      const response = await fetch(
        `${API_BASE_URL}/social/users/${userId}/unfollow`,
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
      const response = await fetch(
        `${API_BASE_URL}/social/users/${userId}/block`,
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
      const response = await fetch(
        `${API_BASE_URL}/social/users/${userId}/unblock`,
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
    loginWithToken,
    register,
    logout,
    updateProfile,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    clearError,
    refreshToken,
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
