import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import {
  Bell,
  User,
  MapPin,
  Building,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Mail,
  Phone,
  Eye,
  Shield,
  Lock,
  Unlock,
  Settings,
  Save,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  MessageSquare,
  Heart,
  Award,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  UserX,
  UserCheck,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Separator } from "../../ui/separator";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { apiClient } from "../../../lib/apiClient";

const SETTINGS_CARD_SURFACE =
  "card-interactive bg-card shadow-sm border border-border";
const SETTINGS_MUTED_SURFACE =
  "rounded-md border border-border bg-muted/30";

// Enhanced Follow Requests Manager Component
const FollowRequestsManager: React.FC = () => {
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();
  const fetchInFlightRef = useRef(false);

  const buildAuthHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const fetchFollowRequests = useCallback(async (force = false) => {
    if (fetchInFlightRef.current && !force) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      setLoading(true);
      const response = await apiClient.fetch(
        "/users/follow-requests",
        {
          headers: buildAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFollowRequests(data.data.followRequests || []);
      }
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
    }
  }, [buildAuthHeaders]);

  useEffect(() => {
    void fetchFollowRequests(true);
  }, [fetchFollowRequests]);

  const handleFollowRequest = async (
    userId: string,
    action: "accept" | "reject"
  ) => {
    try {
      const endpoint =
        action === "accept"
          ? `/users/accept-follow-request/${userId}`
          : `/users/reject-follow-request/${userId}`;

      const response = await apiClient.fetch(endpoint, {
        method: "POST",
        headers: buildAuthHeaders(),
      });

      if (response.ok) {
        success(
          `Follow request ${action}ed!`,
          `The request has been ${action}ed successfully.`
        );
        await fetchFollowRequests(true);
      } else {
        const errorData = await response.json();
        error(
          "Failed to process request",
          errorData.message || "Please try again."
        );
      }
    } catch (error: any) {
      console.error(`Error ${action}ing follow request:`, error);
      error("Failed to process request", "Please try again.");
    }
  };

  const handleBulkAction = async (action: "accept" | "reject") => {
    const userIds = Array.from(selectedIds);
    if (userIds.length === 0) {
      error("No requests selected", "Select at least one request first.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.fetch(
        "/users/follow-requests/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({ action, userIds }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || `Bulk ${action} failed`);
      }

      success(
        action === "accept"
          ? "Selected requests accepted"
          : "Selected requests rejected"
      );
      setSelectedIds(new Set());
      await fetchFollowRequests(true);
    } catch (err: any) {
      console.error(`Error bulk ${action}:`, err);
      error(`Failed to ${action} selected`, err?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={SETTINGS_CARD_SURFACE}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Follow Requests
          </CardTitle>
          <CardDescription>Manage incoming follow requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={SETTINGS_CARD_SURFACE}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Users className="h-6 w-6" />
          Follow Requests ({followRequests.length})
        </CardTitle>
        <CardDescription>Manage incoming follow requests</CardDescription>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/follow-requests")}
          >
            Open Full Manager
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedIds.size === 0 || loading}
            onClick={() => handleBulkAction("accept")}
          >
            Accept Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedIds.size === 0 || loading}
            onClick={() => handleBulkAction("reject")}
          >
            Reject Selected
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {followRequests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending follow requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {followRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(request._id)}
                    onChange={() => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(request._id)) {
                          next.delete(request._id);
                        } else {
                          next.add(request._id);
                        }
                        return next;
                      });
                    }}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.profilePicture} />
                    <AvatarFallback>
                      {request.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-gray-500">@{request.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFollowRequest(request._id, "accept")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFollowRequest(request._id, "reject")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BlockedUsersManager: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const fetchInFlightRef = useRef(false);

  const buildAuthHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const fetchBlockedUsers = useCallback(async (force = false) => {
    if (fetchInFlightRef.current && !force) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      setLoading(true);
      const response = await apiClient.fetch("/users/blocked", {
        headers: buildAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
    }
  }, [buildAuthHeaders]);

  useEffect(() => {
    void fetchBlockedUsers(true);
  }, [fetchBlockedUsers]);

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await apiClient.fetch(
        `/users/unblock/${userId}`,
        {
          method: "POST",
          headers: buildAuthHeaders(),
        }
      );

      if (response.ok) {
        success("User unblocked!", "The user has been unblocked successfully.");
        await fetchBlockedUsers(true);
      } else {
        const errorData = await response.json();
        error(
          "Failed to unblock user",
          errorData.message || "Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      error("Failed to unblock user", "Please try again.");
    }
  };

  if (loading) {
    return (
      <Card className={SETTINGS_CARD_SURFACE}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-6 w-6" />
            Blocked Users
          </CardTitle>
          <CardDescription>Manage your blocked users list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={SETTINGS_CARD_SURFACE}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <UserX className="h-6 w-6" />
          Blocked Users ({blockedUsers.length})
        </CardTitle>
        <CardDescription>Manage your blocked users list</CardDescription>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No blocked users</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblockUser(user._id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = ({ checked, onCheckedChange, label, description, icon }) => (
  <div className="group flex items-center justify-between p-4 rounded-md border border-border bg-card hover:border-navy-400 hover:shadow-sm transition-all duration-300">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-navy-50 dark:bg-navy-900/30 text-navy-600 dark:text-navy-400 rounded-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-foreground">{label}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
        checked
          ? "bg-navy-600 shadow-sm"
          : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error, warning, info } = useToast();
  const [activeTab, setActiveTab] = useState<
    "account" | "privacy" | "notifications"
  >("account");
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [settings, setSettings] = useState({
    username: "",
    email: "",
    twoFactorEnabled: false,
    profileVisibility: "public",
    showFollowers: "public",
    showFollowing: "public",
    showPosts: "public",
    allowMessages: "everyone",
    allowComments: "everyone",
    showOnlineStatus: true,
    showLastSeen: true,
    showEmail: false,
    showPhone: false,
    newFollowers: true,
    newLikes: true,
    newComments: true,
    mentions: true,
    achievements: true,
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    company: "",
    position: "",
    linkedin: "",
    github: "",
    portfolio: "",
    emails: [""],
    profilePicture: "",
  });

  // Load existing settings from user object
  useEffect(() => {
    if (user) {
      console.log("Loading settings from user:", user);

      setSettings({
        username: user.username || "",
        email: user.email || "",
        twoFactorEnabled: user.preferences?.account?.twoFactorEnabled || false,
        profileVisibility:
          user.preferences?.privacy?.profileVisibility || "public",
        showFollowers: user.preferences?.privacy?.showFollowers
          ? "public"
          : "private",
        showFollowing: user.preferences?.privacy?.showFollowing
          ? "public"
          : "private",
        showPosts: user.preferences?.privacy?.showPosts || "public",
        allowMessages: user.preferences?.privacy?.allowMessages || "everyone",
        allowComments: user.preferences?.privacy?.allowComments || "everyone",
        showOnlineStatus: user.preferences?.privacy?.showOnlineStatus !== false,
        showLastSeen: user.preferences?.privacy?.showLastSeen !== false,
        showEmail: user.preferences?.privacy?.showEmail || false,
        showPhone: user.preferences?.privacy?.showPhone || false,
        newFollowers: user.preferences?.notifications?.newFollowers !== false,
        newLikes: user.preferences?.notifications?.newLikes !== false,
        newComments: user.preferences?.notifications?.newComments !== false,
        mentions: user.preferences?.notifications?.mentions !== false,
        achievements: user.preferences?.notifications?.achievements !== false,
      });

      setEditProfileData({
        name: user.name || "",
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
        bio: user.profile?.bio || "",
        location: user.profile?.location || "",
        company: user.profile?.company || "",
        position: user.profile?.position || "",
        linkedin: user.profile?.socialLinks?.linkedin || "",
        github: user.profile?.socialLinks?.github || "",
        portfolio: user.profile?.socialLinks?.portfolio || "",
        emails: user.email ? [user.email] : [],
        profilePicture: user.profilePicture || "",
      });

      setEmailForm((prev) => ({
        ...prev,
        newEmail: user.email || "",
      }));
    }
  }, [user]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, []);

  // Username availability check with debouncing
  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      if (!username || username === user?.username) {
        setUsernameAvailable(null);
        return;
      }

      setUsernameCheckLoading(true);
      try {
        const response = await apiClient.fetch(
          `/auth/check-username?username=${encodeURIComponent(
            username
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUsernameAvailable(data.available);
        } else {
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.error("Error checking username availability:", error);
        setUsernameAvailable(false);
      } finally {
        setUsernameCheckLoading(false);
      }
    },
    [user?.username]
  );

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Combine firstName and lastName into full name
      const fullName = `${editProfileData.firstName || ""} ${
        editProfileData.lastName || ""
      }`.trim();

      const response = await apiClient.fetch(`/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: fullName,
          bio: editProfileData.bio,
          location: editProfileData.location,
          company: editProfileData.company,
          position: editProfileData.position,
          socialLinks: {
            linkedin: editProfileData.linkedin,
            github: editProfileData.github,
            portfolio: editProfileData.portfolio,
          },
          emails: editProfileData.emails || [user?.email],
          profilePicture: editProfileData.profilePicture,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateProfile(data.data.user);
        setShowEditProfile(false);
        success(
          "Profile updated successfully!",
          "Your profile has been updated."
        );
      } else {
        const errorData = await response.json();
        error("Failed to update profile", errorData.message || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      error("Failed to update profile", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await apiClient.fetch(
        `/users/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            account: {
              twoFactorEnabled: settings.twoFactorEnabled,
            },
            privacy: {
              profileVisibility: settings.profileVisibility,
              showFollowers: settings.showFollowers === "public",
              showFollowing: settings.showFollowing === "public",
              showPosts: settings.showPosts,
              allowMessages: settings.allowMessages,
              allowComments: settings.allowComments,
              showOnlineStatus: settings.showOnlineStatus,
              showLastSeen: settings.showLastSeen,
              showEmail: settings.showEmail,
              showPhone: settings.showPhone,
            },
            notifications: {
              newFollowers: settings.newFollowers,
              newLikes: settings.newLikes,
              newComments: settings.newComments,
              mentions: settings.mentions,
              achievements: settings.achievements,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await updateProfile(data.data.user);
        success(
          "Settings saved successfully!",
          "Your preferences have been updated."
        );
      } else {
        const errorData = await response.json();
        error("Failed to save settings", errorData.message || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      error("Failed to save settings", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      warning(
        "Password required",
        "Please enter your password to confirm account deletion."
      );
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiClient.fetch(
        `/auth/delete-account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            password: deletePassword,
          }),
        }
      );

      if (response.ok) {
        success(
          "Account deleted successfully",
          "You will be logged out in 2 seconds."
        );
        await logout();
      } else {
        const errorData = await response.json();
        error("Failed to delete account", errorData.message || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      error("Failed to delete account", "Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    }
  };

  // Handle username update
  const handleUsernameUpdate = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await apiClient.fetch(
        `/auth/update-username`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            username: settings.username,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await updateProfile(data.data.user);
        success(
          "Username updated successfully!",
          "Your username has been updated."
        );
      } else {
        const errorData = await response.json();
        error(
          "Failed to update username",
          errorData.message || "Unknown error"
        );
      }
    } catch (error: any) {
      console.error("Error updating username:", error);
      error("Failed to update username", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!newPassword) {
      warning("New password required", "Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      warning(
        "Password too short",
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      warning("Passwords do not match", "Please confirm your new password.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const payload: Record<string, string> = { newPassword };
      if (passwordForm.currentPassword.trim()) {
        payload.currentPassword = passwordForm.currentPassword.trim();
      }

      const response = await apiClient.fetch("/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        success("Password updated", data.message || "Password updated successfully.");
      } else {
        error("Failed to update password", data.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      error("Failed to update password", "Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    if (!newEmail) {
      warning("Email required", "Please enter a new email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      warning("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (newEmail === (user?.email || "").toLowerCase()) {
      info("No changes", "Please enter a different email address.");
      return;
    }

    setIsChangingEmail(true);
    try {
      const payload: Record<string, string> = { newEmail };
      if (emailForm.currentPassword.trim()) {
        payload.currentPassword = emailForm.currentPassword.trim();
      }

      const response = await apiClient.fetch("/auth/change-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        if (data?.data?.user) {
          await updateProfile(data.data.user);
        }
        setSettings((prev) => ({ ...prev, email: newEmail }));
        setEmailForm((prev) => ({ ...prev, currentPassword: "" }));
        success(
          "Email updated",
          data.message || "Your email has been updated successfully."
        );
      } else {
        error("Failed to change email", data.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error changing email:", err);
      error("Failed to change email", "Please try again.");
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Edit Profile Dialog Component
  const EditProfileDialog: React.FC<{
    user: any;
    editProfileData: any;
    setEditProfileData: any;
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
  }> = ({
    user,
    editProfileData,
    setEditProfileData,
    onClose,
    onSave,
    isSaving,
  }) => {
    const [profilePicture, setProfilePicture] = useState(
      user?.profilePicture || ""
    );
    const [newEmail, setNewEmail] = useState("");
    const [showAddEmail, setShowAddEmail] = useState(false);

    const handleProfilePictureUpload = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (file) {
        // Handle file upload logic here
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicture(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleRemoveProfilePicture = () => {
      setProfilePicture("");
    };

    const handleAddEmail = () => {
      if (newEmail && !editProfileData.emails?.includes(newEmail)) {
        const updatedEmails = [...(editProfileData.emails || []), newEmail];
        setEditProfileData({ ...editProfileData, emails: updatedEmails });
        setNewEmail("");
        setShowAddEmail(false);
      }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
      const updatedEmails =
        editProfileData.emails?.filter(
          (email: string) => email !== emailToRemove
        ) || [];
      setEditProfileData({ ...editProfileData, emails: updatedEmails });
    };

    const handleUnlinkGoogle = async () => {
      try {
        const response = await apiClient.fetch(
          `/auth/unlink-google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          success("Google account unlinked successfully!");
          // Update user state to reflect the change
          // You might need to refresh user data here
        } else {
          const errorData = await response.json();
          error(
            "Failed to unlink Google account",
            errorData.message || "Unknown error"
          );
        }
      } catch (error: any) {
        console.error("Error unlinking Google account:", error);
        error("Failed to unlink Google account", "Please try again.");
      }
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-gray-800 dark:bg-gray-900 border-gray-700 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DialogHeader className="p-6 border-b border-gray-700">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <DialogTitle className="text-white text-xl font-semibold">
                  Update profile
                </DialogTitle>
              </motion.div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Profile Picture Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-start space-x-4"
              >
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-2 ring-gray-600 transition-all duration-300 hover:ring-blue-500">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex space-x-4">
                    <label className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors duration-200">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                      Upload
                    </label>
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="text-red-500 hover:text-red-400 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Recommended size 1:1, up to 10MB.
                  </p>
                </div>
              </motion.div>

              {/* Name Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <Label
                    htmlFor="edit-firstname"
                    className="text-sm font-medium text-gray-300"
                  >
                    First name
                  </Label>
                  <Input
                    id="edit-firstname"
                    value={
                      editProfileData.firstName ||
                      editProfileData.name?.split(" ")[0] ||
                      ""
                    }
                    onChange={(e) =>
                      setEditProfileData((prev: any) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Enter first name"
                    className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-lastname"
                    className="text-sm font-medium text-gray-300"
                  >
                    Last name
                  </Label>
                  <Input
                    id="edit-lastname"
                    value={
                      editProfileData.lastName ||
                      editProfileData.name?.split(" ").slice(1).join(" ") ||
                      ""
                    }
                    onChange={(e) =>
                      setEditProfileData((prev: any) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Enter last name"
                    className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </motion.div>

              {/* Email Addresses Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-300">
                  Email addresses
                </h3>
                <div className="space-y-2">
                  {editProfileData.emails?.map(
                    (email: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors duration-200"
                      >
                        <span className="text-white">{email}</span>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <Badge className="text-xs bg-blue-600 text-white">
                              Primary
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmail(email)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  )}

                  {showAddEmail ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex space-x-2"
                    >
                      <Input
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                        type="email"
                        className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      />
                      <Button
                        onClick={handleAddEmail}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddEmail(false)}
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors duration-200"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddEmail(true)}
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto transition-colors duration-200"
                    >
                      <Mail className="h-4 w-4 mr-2" />+ Add email address
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Connected Accounts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-300">
                  Connected accounts
                </h3>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-white">Google • {user?.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkGoogle}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200"
                  >
                    Unlink
                  </Button>
                </div>
              </motion.div>

              {/* Additional Profile Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="space-y-4"
              >
                <div>
                  <Label
                    htmlFor="edit-bio"
                    className="text-sm font-medium text-gray-300"
                  >
                    Bio
                  </Label>
                  <textarea
                    id="edit-bio"
                    value={editProfileData.bio}
                    onChange={(e) =>
                      setEditProfileData((prev: any) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    placeholder="Tell us about yourself"
                    className="w-full p-3 border border-gray-600 rounded-lg resize-none mt-2 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="edit-location"
                      className="text-sm font-medium text-gray-300"
                    >
                      Location
                    </Label>
                    <Input
                      id="edit-location"
                      value={editProfileData.location}
                      onChange={(e) =>
                        setEditProfileData((prev: any) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Enter your location"
                      className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-company"
                      className="text-sm font-medium text-gray-300"
                    >
                      Company
                    </Label>
                    <Input
                      id="edit-company"
                      value={editProfileData.company}
                      onChange={(e) =>
                        setEditProfileData((prev: any) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      placeholder="Enter your company"
                      className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="edit-linkedin"
                      className="text-sm font-medium text-gray-300"
                    >
                      LinkedIn
                    </Label>
                    <Input
                      id="edit-linkedin"
                      value={editProfileData.linkedin}
                      onChange={(e) =>
                        setEditProfileData((prev: any) => ({
                          ...prev,
                          linkedin: e.target.value,
                        }))
                      }
                      placeholder="LinkedIn URL"
                      className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-github"
                      className="text-sm font-medium text-gray-300"
                    >
                      GitHub
                    </Label>
                    <Input
                      id="edit-github"
                      value={editProfileData.github}
                      onChange={(e) =>
                        setEditProfileData((prev: any) => ({
                          ...prev,
                          github: e.target.value,
                        }))
                      }
                      placeholder="GitHub URL"
                      className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-portfolio"
                      className="text-sm font-medium text-gray-300"
                    >
                      Portfolio
                    </Label>
                    <Input
                      id="edit-portfolio"
                      value={editProfileData.portfolio}
                      onChange={(e) =>
                        setEditProfileData((prev: any) => ({
                          ...prev,
                          portfolio: e.target.value,
                        }))
                      }
                      placeholder="Portfolio URL"
                      className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-700"
            >
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete Account Dialog Component
  const DeleteAccountDialog: React.FC<{
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    deletePassword: string;
    setDeletePassword: (password: string) => void;
  }> = ({
    onClose,
    onConfirm,
    isDeleting,
    deletePassword,
    setDeletePassword,
  }) => (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Warning: This will permanently delete your account and all
              associated data.
            </p>
          </div>
          <div>
            <Label htmlFor="delete-password">
              Enter your password to confirm
            </Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting || !deletePassword}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background py-8"
      >
        {/* Modal-like Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="card-interactive bg-card overflow-hidden"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border">
              <div>
                <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Fine-tune account, privacy, and notifications with a cleaner control center.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Two-Pane Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] min-h-[680px]">
              {/* Left Pane - Navigation */}
              <div className="bg-muted/30 border-r border-border p-6 lg:p-7">
                <div className="space-y-6 lg:sticky lg:top-6">
                  {/* Account Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1 tracking-tight">
                      Workspace
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Navigate quickly between preferences.
                    </p>

                    {/* Navigation Menu */}
                    <div className="space-y-1">
                      <Button
                        variant={activeTab === "account" ? "secondary" : "ghost"}
                        className="w-full justify-start h-10 px-4"
                        onClick={() => setActiveTab("account")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>

                      <Button
                        variant={activeTab === "privacy" ? "secondary" : "ghost"}
                        className="w-full justify-start h-10 px-4"
                        onClick={() => setActiveTab("privacy")}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                      </Button>

                      <Button
                        variant={activeTab === "notifications" ? "secondary" : "ghost"}
                        className="w-full justify-start h-10 px-4"
                        onClick={() => setActiveTab("notifications")}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane - Content */}
              <div className="p-6 sm:p-8 bg-white/60 dark:bg-slate-900/20">
                {/* Content Header */}
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-slate-900 dark:text-slate-100">
                    {activeTab === "account" && "Profile details"}
                    {activeTab === "privacy" && "Security settings"}
                    {activeTab === "notifications" &&
                      "Notification preferences"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Changes are local until you hit Save Settings.
                  </p>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                  {/* Account Tab */}
                  {activeTab === "account" && (
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className={`${SETTINGS_MUTED_SURFACE} p-5`}>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Profile
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-600">
                              <AvatarImage src={user?.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user?.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{user?.username}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={() => setShowEditProfile(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            Update profile
                          </Button>
                        </div>
                      </div>

                      {/* Username Management Section */}
                      <div className={`${SETTINGS_MUTED_SURFACE} p-5`}>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Username
                        </h3>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              id="username"
                              value={settings.username}
                              onChange={(e) => {
                                setSettings({
                                  ...settings,
                                  username: e.target.value,
                                });
                                if (usernameDebounceRef.current) {
                                  clearTimeout(usernameDebounceRef.current);
                                }
                                usernameDebounceRef.current = setTimeout(() => {
                                  checkUsernameAvailability(e.target.value);
                                }, 500);
                              }}
                              className="flex-1"
                              placeholder="Enter username"
                            />
                            <Button
                              onClick={handleUsernameUpdate}
                              disabled={
                                isSaving ||
                                !settings.username ||
                                settings.username === user?.username ||
                                usernameAvailable === false ||
                                usernameCheckLoading
                              }
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </Button>
                          </div>
                          {usernameCheckLoading && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Checking availability...
                            </p>
                          )}
                          {usernameAvailable === true && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Username is available
                            </p>
                          )}
                          {usernameAvailable === false && (
                            <p className="text-sm text-red-500 mt-1">
                              Username is already taken
                            </p>
                          )}
                          {user?.username && !settings.username && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Username is set
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email Addresses Section */}
                      <div className={`${SETTINGS_MUTED_SURFACE} p-5`}>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Email addresses
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-white">
                              {user?.email}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                Primary
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="text-gray-500 dark:text-gray-400">
                                  ⋯
                                </span>
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
                          >
                            <Mail className="h-4 w-4 mr-2" />+ Add email address
                          </Button>
                        </div>
                      </div>

                      {/* Connected Accounts Section */}
                      <div className={`${SETTINGS_MUTED_SURFACE} p-5`}>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Connected accounts
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                G
                              </span>
                            </div>
                            <span className="text-gray-900 dark:text-white">
                              Google • {user?.email}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <span className="text-gray-500 dark:text-gray-400">
                              ⋯
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Follow Requests */}
                      <FollowRequestsManager />

                      {/* Blocked Users */}
                      <BlockedUsersManager />
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeTab === "privacy" && (
                    <div className="space-y-6">
                      {/* Account Information */}
                      <Card className={SETTINGS_CARD_SURFACE}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <User className="h-6 w-6" />
                            Account Information
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage your basic account information
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label
                                  htmlFor="email"
                                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Current email
                                </Label>
                                <Input
                                  id="email"
                                  value={settings.email}
                                  readOnly
                                  type="email"
                                  className="mt-2"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Use the Security Settings section below to
                                  change your email.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Privacy Settings */}
                      <Card className={SETTINGS_CARD_SURFACE}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Shield className="h-6 w-6" />
                            Privacy Settings
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Control who can see your information and interact
                            with you
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Profile Visibility */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Eye className="h-5 w-5" />
                              Profile Visibility
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Profile Visibility
                                </Label>
                                <select
                                  value={settings.profileVisibility}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      profileVisibility: e.target.value as
                                        | "public"
                                        | "private"
                                        | "friends",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="public">Public</option>
                                  <option value="friends">Friends Only</option>
                                  <option value="private">Private</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can see your profile
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Show Followers
                                </Label>
                                <select
                                  value={settings.showFollowers}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      showFollowers: e.target.value as
                                        | "public"
                                        | "private",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="public">Public</option>
                                  <option value="private">Private</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can see your followers list
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Show Following
                                </Label>
                                <select
                                  value={settings.showFollowing}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      showFollowing: e.target.value as
                                        | "public"
                                        | "private",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="public">Public</option>
                                  <option value="private">Private</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can see who you follow
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Show Posts
                                </Label>
                                <select
                                  value={settings.showPosts}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      showPosts: e.target.value as
                                        | "public"
                                        | "friends"
                                        | "private",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="public">Public</option>
                                  <option value="friends">Friends Only</option>
                                  <option value="private">Private</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can see your posts
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Interaction Settings */}
                          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Interaction Settings
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Allow Messages
                                </Label>
                                <select
                                  value={settings.allowMessages}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      allowMessages: e.target.value as
                                        | "everyone"
                                        | "friends"
                                        | "none",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="everyone">Everyone</option>
                                  <option value="friends">Friends Only</option>
                                  <option value="none">No One</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can send you messages
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Allow Comments
                                </Label>
                                <select
                                  value={settings.allowComments}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      allowComments: e.target.value as
                                        | "everyone"
                                        | "friends"
                                        | "none",
                                    }))
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="everyone">Everyone</option>
                                  <option value="friends">Friends Only</option>
                                  <option value="none">No One</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Who can comment on your posts
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Visibility Settings */}
                          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Eye className="h-5 w-5" />
                              Visibility Settings
                            </h4>

                            <div className="space-y-4">
                              <ToggleSwitch
                                checked={settings.showOnlineStatus}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    showOnlineStatus: checked,
                                  }))
                                }
                                label="Show Online Status"
                                description="Show when you're online"
                                icon={
                                  <Eye className="h-5 w-5 text-green-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.showLastSeen}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    showLastSeen: checked,
                                  }))
                                }
                                label="Show Last Seen"
                                description="Show when you were last active"
                                icon={<Eye className="h-5 w-5 text-blue-600" />}
                              />

                              <ToggleSwitch
                                checked={settings.showEmail}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    showEmail: checked,
                                  }))
                                }
                                label="Show Email"
                                description="Show your email on profile"
                                icon={
                                  <Mail className="h-5 w-5 text-purple-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.showPhone}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    showPhone: checked,
                                  }))
                                }
                                label="Show Phone"
                                description="Show your phone on profile"
                                icon={
                                  <Phone className="h-5 w-5 text-orange-600" />
                                }
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Security Settings */}
                      <Card className={SETTINGS_CARD_SURFACE}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Lock className="h-6 w-6" />
                            Security Settings
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage your account security and authentication
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <ToggleSwitch
                              checked={settings.twoFactorEnabled}
                              onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  twoFactorEnabled: checked,
                                }))
                              }
                              label="Two-Factor Authentication"
                              description="Add an extra layer of security to your account"
                              icon={<Lock className="h-5 w-5 text-blue-600" />}
                            />
                          </div>

                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Change password
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Current password
                                </Label>
                                <Input
                                  type="password"
                                  value={passwordForm.currentPassword}
                                  onChange={(e) =>
                                    setPasswordForm((prev) => ({
                                      ...prev,
                                      currentPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="Current password"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  New password
                                </Label>
                                <Input
                                  type="password"
                                  value={passwordForm.newPassword}
                                  onChange={(e) =>
                                    setPasswordForm((prev) => ({
                                      ...prev,
                                      newPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="New password"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Confirm new password
                                </Label>
                                <Input
                                  type="password"
                                  value={passwordForm.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordForm((prev) => ({
                                      ...prev,
                                      confirmPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="Confirm new password"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              For Google-only accounts, leave current password
                              empty to set your first password.
                            </p>
                            <div className="flex justify-end">
                              <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isChangingPassword ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Updating...
                                  </>
                                ) : (
                                  "Update password"
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Change email
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  New email
                                </Label>
                                <Input
                                  type="email"
                                  value={emailForm.newEmail}
                                  onChange={(e) =>
                                    setEmailForm((prev) => ({
                                      ...prev,
                                      newEmail: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter new email"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Current password (if set)
                                </Label>
                                <Input
                                  type="password"
                                  value={emailForm.currentPassword}
                                  onChange={(e) =>
                                    setEmailForm((prev) => ({
                                      ...prev,
                                      currentPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="Current password"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                onClick={handleChangeEmail}
                                disabled={isChangingEmail}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isChangingEmail ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Updating...
                                  </>
                                ) : (
                                  "Update email"
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Danger Zone */}
                      <Card className="rounded-2xl border border-rose-200/80 dark:border-rose-800/70 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            Danger Zone
                          </CardTitle>
                          <CardDescription className="text-red-600 dark:text-red-400">
                            Irreversible and destructive actions
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <div>
                              <h4 className="font-semibold text-red-800 dark:text-red-200">
                                Delete Account
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                Permanently delete your account and all
                                associated data
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowDeleteConfirm(true)}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      {/* Notification Preferences */}
                      <Card className={SETTINGS_CARD_SURFACE}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Bell className="h-6 w-6" />
                            Notification Preferences
                          </CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Customize your notification settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Social Notifications
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <ToggleSwitch
                                checked={settings.newFollowers}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    newFollowers: checked,
                                  }))
                                }
                                label="New Followers"
                                description="When someone follows you"
                                icon={
                                  <UserPlus className="h-5 w-5 text-blue-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.newLikes}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    newLikes: checked,
                                  }))
                                }
                                label="New Likes"
                                description="When someone likes your posts"
                                icon={
                                  <Heart className="h-5 w-5 text-red-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.newComments}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    newComments: checked,
                                  }))
                                }
                                label="New Comments"
                                description="When someone comments on your posts"
                                icon={
                                  <MessageSquare className="h-5 w-5 text-green-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.mentions}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    mentions: checked,
                                  }))
                                }
                                label="Mentions"
                                description="When someone mentions you"
                                icon={
                                  <MessageSquare className="h-5 w-5 text-purple-600" />
                                }
                              />

                              <ToggleSwitch
                                checked={settings.achievements}
                                onCheckedChange={(checked) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    achievements: checked,
                                  }))
                                }
                                label="Achievements"
                                description="When you unlock new achievements"
                                icon={
                                  <Award className="h-5 w-5 text-yellow-600" />
                                }
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-8 py-3 text-white shadow-lg shadow-cyan-600/30 rounded-xl"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Edit Profile Dialog */}
        {showEditProfile && (
          <EditProfileDialog
            user={user}
            editProfileData={editProfileData}
            setEditProfileData={setEditProfileData}
            onClose={() => setShowEditProfile(false)}
            onSave={handleSaveProfile}
            isSaving={isSaving}
          />
        )}

        {/* Delete Account Dialog */}
        {showDeleteConfirm && (
          <DeleteAccountDialog
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteAccount}
            isDeleting={isDeleting}
            deletePassword={deletePassword}
            setDeletePassword={setDeletePassword}
          />
        )}
      </motion.div>
    </>
  );
};

export default SettingsPage;
