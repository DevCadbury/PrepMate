import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast, ToastContainer } from "../../ui/toast";
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

// Enhanced Follow Requests Manager Component
const FollowRequestsManager: React.FC = () => {
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const fetchFollowRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/users/follow-requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
    }
  };

  useEffect(() => {
    fetchFollowRequests();
  }, []);

  const handleFollowRequest = async (
    userId: string,
    action: "accept" | "reject"
  ) => {
    try {
      const endpoint =
        action === "accept"
          ? `http://localhost:5000/api/users/accept-follow-request/${userId}`
          : `http://localhost:5000/api/users/reject-follow-request/${userId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        success(
          `Follow request ${action}ed!`,
          `The request has been ${action}ed successfully.`
        );
        await fetchFollowRequests();
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

  if (loading) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Follow Requests ({followRequests.length})
        </CardTitle>
        <CardDescription>Manage incoming follow requests</CardDescription>
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
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
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

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/users/blocked", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/unblock/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        success("User unblocked!", "The user has been unblocked successfully.");
        await fetchBlockedUsers();
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
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
                className="flex items-center justify-between p-4 border rounded-lg"
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
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    <Button
      variant={checked ? "default" : "outline"}
      size="sm"
      onClick={() => onCheckedChange(!checked)}
      className={checked ? "bg-green-600 hover:bg-green-700" : ""}
    >
      {checked ? "Enabled" : "Disabled"}
    </Button>
  </div>
);

const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, success, error, warning, info, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "account" | "privacy" | "notifications"
  >("account");
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);
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
        emails: [user.email] || [],
        profilePicture: user.profilePicture || "",
      });
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
        const response = await fetch(
          `http://localhost:5000/api/auth/check-username?username=${encodeURIComponent(
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

      const response = await fetch(`http://localhost:5000/api/profile`, {
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
      const response = await fetch(
        `http://localhost:5000/api/users/preferences`,
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
      const response = await fetch(
        `http://localhost:5000/api/auth/delete-account`,
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
      const response = await fetch(
        `http://localhost:5000/api/auth/update-username`,
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
        const response = await fetch(
          `http://localhost:5000/api/auth/unlink-google`,
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
      >
        {/* Modal-like Container */}
        <div className="max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account preferences and privacy settings
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Two-Pane Layout */}
            <div className="flex min-h-[600px]">
              {/* Left Pane - Navigation */}
              <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  {/* Account Section */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Account
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Manage your account info.
                    </p>

                    {/* Navigation Menu */}
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab("account")}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === "account"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Profile</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("privacy")}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === "privacy"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">Security</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("notifications")}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === "notifications"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Bell className="h-5 w-5" />
                        <span className="font-medium">Notifications</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    {/* Footer content removed - keeping the border for visual separation */}
                  </div>
                </div>
              </div>

              {/* Right Pane - Content */}
              <div className="flex-1 p-6 bg-white dark:bg-gray-800">
                {/* Content Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {activeTab === "account" && "Profile details"}
                    {activeTab === "privacy" && "Security settings"}
                    {activeTab === "notifications" &&
                      "Notification preferences"}
                  </h2>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                  {/* Account Tab */}
                  {activeTab === "account" && (
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
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
                      <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
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
                                  Email
                                </Label>
                                <Input
                                  id="email"
                                  value={settings.email}
                                  onChange={(e) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      email: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter email"
                                  type="email"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Privacy Settings */}
                      <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
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
                      <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
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
                        </CardContent>
                      </Card>

                      {/* Danger Zone */}
                      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-800">
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
                      <Card className="bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
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
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-8 py-3"
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
