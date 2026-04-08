import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast, ToastContainer } from "../../ui/toast";
import PostCard from "../../ui/post-card";
import PostCreator from "../../ui/post-creator";
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
import { Textarea } from "../../ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import { Skeleton } from "../../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import {
  User,
  Camera,
  MapPin,
  Building,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  Calendar,
  Edit,
  Settings,
  Users,
  UserPlus,
  UserMinus,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  Loader2,
  Save,
  X,
  Star,
  Award,
  Target,
  TrendingUp,
  UserCheck,
  Trophy,
  Plus,
  ExternalLink,
  BookOpen,
  Zap,
  Mic,
  Flame,
  Medal,
  BarChart3,
  Image as ImageIcon,
  FileText,
  Sparkles,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  BookmarkPlus,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Crown,
  BadgeCheck,
  Activity,
  Bookmark as BookmarkIcon,
  Activity as ActivityIcon,
  Save as SaveIcon,
  MoreVertical,
  Shield,
  X as XMark,
  LogOut,
  Trash2,
  Grid3X3,
  List,
  Search,
} from "lucide-react";
import cloudinaryService from "../../../services/cloudinaryService";

interface Post {
  id: string;
  content: string;
  type: "question" | "achievement" | "resource" | "interview" | "roadmap";
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  image?: string;
}

interface UserStats {
  problemsSolved: number;
  mockInterviews: number;
  currentStreak: number;
  achievements: number;
}

const StatCard = ({
  icon,
  label,
  value,
  color,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  className?: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`rounded-xl p-4 bg-gradient-to-br from-${color}-50 to-white dark:from-slate-800/80 dark:to-slate-700/60 shadow-lg border border-${color}-100 dark:border-slate-600/50 flex flex-col items-center transition-all duration-200 ${className}`}
  >
    <div className="mb-2 text-2xl">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
    <div className="text-sm text-gray-600 dark:text-slate-300">{label}</div>
  </motion.div>
);

interface ProfilePageProps {
  username?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ username }) => {
  const { user, updateProfile, logout } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const { toasts, success, error, warning, info, removeToast } = useToast();

  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Listen for theme changes from dashboard
  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem("theme");
      const newDarkMode = currentTheme === "dark";
      setIsDarkMode(newDarkMode);

      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Listen for storage changes (when dashboard toggles theme)
    window.addEventListener("storage", handleThemeChange);

    // Listen for custom theme change events
    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  // Use username prop if available, otherwise fall back to userId from params
  const targetUsername = username || userId;

  // Helper function to safely render values
  const safeRender = (value: any, fallback: string = ""): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string" || typeof value === "number")
      return String(value);
    if (typeof value === "object") {
      console.warn("Attempting to render object:", value);
      return fallback;
    }
    return String(value);
  };
  const navigate = useNavigate();
  const [viewingOtherUser, setViewingOtherUser] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [editProfile, setEditProfile] = useState({
    name: user?.name || "",
    location: user?.profile?.location || "",
    bio: user?.profile?.bio || "",
    company: user?.profile?.company || "",
    position: user?.profile?.position || "",
    linkedin: user?.profile?.socialLinks?.linkedin || "",
    github: user?.profile?.socialLinks?.github || "",
    portfolio: user?.profile?.socialLinks?.portfolio || "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [canViewPosts, setCanViewPosts] = useState(true);
  const [canViewFollowers, setCanViewFollowers] = useState(true);
  const [canViewFollowing, setCanViewFollowing] = useState(true);
  const [canFollow, setCanFollow] = useState(true);
  const [canMessage, setCanMessage] = useState(true);
  const [canComment, setCanComment] = useState(true);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    problemsSolved: 278,
    mockInterviews: 24,
    currentStreak: 42,
    achievements: 15,
  });

  // Enhanced followers/following features
  const [followersSearchQuery, setFollowersSearchQuery] = useState("");
  const [followingSearchQuery, setFollowingSearchQuery] = useState("");
  const [showFollowersDropdown, setShowFollowersDropdown] = useState<
    string | null
  >(null);
  const [showFollowingDropdown, setShowFollowingDropdown] = useState<
    string | null
  >(null);
  const [removingFollower, setRemovingFollower] = useState<string | null>(null);
  const [unfollowingUser, setUnfollowingUser] = useState<string | null>(null);
  const [blockingUser, setBlockingUser] = useState<string | null>(null);
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Add rate limiting states
  const isCheckingFollowRef = useRef(false);
  const isFetchingPostsRef = useRef(false);
  const fetchingPostsTargetRef = useRef<string | null>(null);
  const lastFollowCheckRef = useRef<{ userId: string; ts: number } | null>(
    null
  );
  const currentTargetUsernameRef = useRef<string | null>(null);
  const activeProfileTargetRef = useRef<string | null>(null);
  const profileFetchRequestRef = useRef(0);
  const postsFetchRequestRef = useRef(0);
  const lastPostsFetchByTargetRef = useRef<Record<string, number>>({});
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref for profile menu to handle click outside
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Follow Button Skeleton Component
  const FollowButtonSkeleton = () => (
    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
  );

  // Followers/Following List Skeleton Component
  const FollowersListSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  // Handle click outside profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      // Close followers/following dialogs when clicking outside
      const target = event.target as Element;
      const isInsideDialog =
        target.closest("[role='dialog']") ||
        target.closest(".dialog-content") ||
        target.closest("[data-dialog-content]");

      if (!isInsideDialog) {
        setShowFollowersDialog(false);
        setShowFollowingDialog(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    currentTargetUsernameRef.current = targetUsername || null;
  }, [targetUsername]);

  useEffect(() => {
    activeProfileTargetRef.current = viewingOtherUser
      ? otherUser?._id || otherUser?.id || null
      : user?.id || null;
  }, [viewingOtherUser, otherUser, user?.id]);

  const fetchUserPosts = useCallback(async (force = false) => {
    if (!user?.id) return;

    // If viewing other user, we need to get their ID from the otherUser data
    const targetUserId = viewingOtherUser
      ? otherUser?._id || otherUser?.id
      : user.id;

    if (!targetUserId) {
      return;
    }

    if (
      isFetchingPostsRef.current &&
      fetchingPostsTargetRef.current === targetUserId
    ) {
      return;
    }

    const now = Date.now();
    const lastFetchedAt = lastPostsFetchByTargetRef.current[targetUserId] || 0;
    if (!force && now - lastFetchedAt < 1200) {
      return;
    }

    const requestId = ++postsFetchRequestRef.current;
    lastPostsFetchByTargetRef.current[targetUserId] = now;
    isFetchingPostsRef.current = true;
    fetchingPostsTargetRef.current = targetUserId;
    setLoadingPosts(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/user/${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Ignore stale responses after route/profile switches.
        if (
          postsFetchRequestRef.current !== requestId ||
          activeProfileTargetRef.current !== targetUserId
        ) {
          return;
        }

        // Ensure we have an array of posts
        const posts = data.data?.posts || data.posts || [];
        if (Array.isArray(posts)) {
          setUserPosts(posts);
        } else {
          setUserPosts([]);
        }
      } else {
        console.error("Failed to fetch user posts");
        if (
          postsFetchRequestRef.current === requestId &&
          activeProfileTargetRef.current === targetUserId
        ) {
          setUserPosts([]);
        }
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      if (postsFetchRequestRef.current === requestId) {
        setLoadingPosts(false);
      }

      if (fetchingPostsTargetRef.current === targetUserId) {
        isFetchingPostsRef.current = false;
        fetchingPostsTargetRef.current = null;
      }
    }
  }, [user?.id, otherUser?._id, otherUser?.id, viewingOtherUser]);

  const debouncedFetchUserPosts = useCallback(
    (force = false) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchUserPosts(force);
      }, 500);
    },
    [fetchUserPosts]
  );

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const checkFollowStatus = useCallback(async (force = false) => {
    if (!user?.id || !viewingOtherUser || !otherUser) {
      return;
    }

    const targetUserId = otherUser._id || otherUser.id;
    if (!targetUserId) {
      return;
    }

    if (isCheckingFollowRef.current) {
      return;
    }

    const lastCheck = lastFollowCheckRef.current;
    if (
      !force &&
      lastCheck &&
      lastCheck.userId === targetUserId &&
      Date.now() - lastCheck.ts < 1500
    ) {
      return;
    }

    isCheckingFollowRef.current = true;
    lastFollowCheckRef.current = { userId: targetUserId, ts: Date.now() };

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/users/${targetUserId}/follow-status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const followData = data.data;
        const privacy = followData.privacy || otherUser?.preferences?.privacy;
        const profileVisibility = privacy?.profileVisibility;

        setIsFollowing(followData.isFollowing || false);
        setFollowRequestSent(followData.hasRequestSent || false);
        setCanFollow(Boolean(followData.canFollow));

        // Keep privacy access in sync with relationship updates (e.g., request accepted elsewhere).
        if (followData.isFollowing) {
          setCanViewProfile(true);
          setCanViewPosts(true);
          setCanViewFollowers(privacy?.showFollowers !== false);
          setCanViewFollowing(privacy?.showFollowing !== false);
          setCanMessage(privacy?.allowMessages !== "none");
          setCanComment(privacy?.allowComments !== "none");

          // Refresh profile/posts immediately once access is granted.
          fetchProfileData(targetUserId);
          debouncedFetchUserPosts(true);
        } else if (profileVisibility === "private") {
          setCanViewProfile(false);
          setCanViewPosts(false);
          setCanViewFollowers(false);
          setCanViewFollowing(false);
          setCanMessage(false);
          setCanComment(false);
        }

        setFollowStatusLoaded(true);
      } else if (response.status !== 429) {
        const errorData = await response.json().catch(() => ({}));
        console.warn("checkFollowStatus failed:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      isCheckingFollowRef.current = false;
      // Avoid getting stuck on skeleton if follow-status request fails.
      setFollowStatusLoaded(true);
    }
  }, [user?.id, otherUser, viewingOtherUser]);

  const fetchProfileData = async (explicitTargetUserId?: string) => {
    let requestId = 0;
    let requestedTargetUserId = "";

    try {
      // Determine which user ID to use for fetching data
      const targetUserId =
        explicitTargetUserId ||
        (viewingOtherUser && otherUser
          ? otherUser._id || otherUser.id
          : user?.id);

      if (!targetUserId) {
        return;
      }

      requestId = ++profileFetchRequestRef.current;
      requestedTargetUserId = targetUserId;

      // Set loading states
      setLoadingFollowers(true);
      setLoadingFollowing(true);

      const [followersRes, followingRes, postsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/profile/${targetUserId}/followers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`http://localhost:5000/api/profile/${targetUserId}/following`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`http://localhost:5000/api/profile/${targetUserId}/posts`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      if (
        profileFetchRequestRef.current !== requestId ||
        activeProfileTargetRef.current !== targetUserId
      ) {
        return;
      }

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        const followers =
          followersData.data?.followers || followersData.followers || [];
        if (Array.isArray(followers)) {
          setFollowers(followers);
        } else {
          setFollowers([]);
        }
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        const following =
          followingData.data?.following || followingData.following || [];
        if (Array.isArray(following)) {
          setFollowing(following);
        } else {
          setFollowing([]);
        }
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.data?.posts || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("ProfilePage: Error fetching profile data:", error);
      if (
        profileFetchRequestRef.current === requestId &&
        activeProfileTargetRef.current === requestedTargetUserId
      ) {
        setLoading(false);
      }
    } finally {
      if (
        profileFetchRequestRef.current !== requestId ||
        activeProfileTargetRef.current !== requestedTargetUserId
      ) {
        return;
      }

      // Clear loading states
      setLoadingFollowers(false);
      setLoadingFollowing(false);
    }
  };

  useEffect(() => {
    if (user) {
      const viewingDifferentProfile =
        targetUsername && targetUsername !== user?.username;

      if (!viewingDifferentProfile) {
        fetchProfileData();
        debouncedFetchUserPosts(true);
      }

      setEditProfile({
        name: user?.name || "",
        location: user?.profile?.location || "",
        bio: user?.profile?.bio || "",
        company: user?.profile?.company || "",
        position: user?.profile?.position || "",
        linkedin: user?.profile?.socialLinks?.linkedin || "",
        github: user?.profile?.socialLinks?.github || "",
        portfolio: user?.profile?.socialLinks?.portfolio || "",
      });
    }
  }, [user, targetUsername, debouncedFetchUserPosts]);

  // Fetch profile data when otherUser changes (for viewing other profiles)
  useEffect(() => {
    if (viewingOtherUser && otherUser) {
      fetchProfileData();
    }
  }, [otherUser, viewingOtherUser]);

  // Re-check follow status only after the target user is fully available.
  useEffect(() => {
    if (viewingOtherUser && otherUser) {
      setFollowStatusLoaded(false);
      checkFollowStatus(true);
    }
  }, [viewingOtherUser, otherUser, checkFollowStatus]);

  useEffect(() => {
    if (targetUsername && targetUsername !== user?.username) {
      setShowFollowersDialog(false);
      setShowFollowingDialog(false);
      setFollowersSearchQuery("");
      setFollowingSearchQuery("");
      setFollowers([]);
      setFollowing([]);
      setPosts([]);
      setUserPosts([]);
      setViewingOtherUser(true);
      // Reset follow status when switching to a new user
      setFollowStatusLoaded(false);
      setIsFollowing(false);
      setFollowRequestSent(false);
      setCanFollow(true);
      fetchOtherUserData();
    } else {
      setShowFollowersDialog(false);
      setShowFollowingDialog(false);
      setFollowersSearchQuery("");
      setFollowingSearchQuery("");
      setFollowers([]);
      setFollowing([]);
      setPosts([]);
      setUserPosts([]);
      setViewingOtherUser(false);
      setOtherUser(null);
      setFollowStatusLoaded(false);
      setIsFollowing(false);
      setFollowRequestSent(false);
      setCanViewProfile(true);
      setCanViewPosts(true);
      setCanViewFollowers(true);
      setCanViewFollowing(true);
      setCanFollow(false);
      setCanMessage(false);
      setCanComment(false);
      if (user?.id) {
        fetchProfileData(user.id);
      }
      debouncedFetchUserPosts(true);
    }
  }, [targetUsername, user?.username]);

  // Fetch posts when otherUser is loaded
  useEffect(() => {
    if (viewingOtherUser && otherUser) {
      debouncedFetchUserPosts(true);
    }
  }, [otherUser, viewingOtherUser, debouncedFetchUserPosts]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".dropdown-menu")) {
        setShowFollowersDropdown(null);
        setShowFollowingDropdown(null);
      }
      if (!(event.target as Element).closest(".profile-menu")) {
        setShowProfileMenu(false);
      }
      // Close followers/following dialogs when clicking outside
      const target = event.target as Element;
      const isInsideDialog =
        target.closest("[role='dialog']") ||
        target.closest(".dialog-content") ||
        target.closest("[data-dialog-content]");

      if (!isInsideDialog) {
        setShowFollowersDialog(false);
        setShowFollowingDialog(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOtherUserData = async () => {
    if (!targetUsername) return;

    const requestedUsername = targetUsername;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/username/${targetUsername}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (currentTargetUsernameRef.current !== requestedUsername) {
          return;
        }

        setOtherUser(data.data.user);
        checkPrivacyAndFollowStatus(data.data.user);
      } else {
        console.error("Failed to fetch other user data");
      }
    } catch (error) {
      console.error("Error fetching other user data:", error);
    }
  };

  const checkPrivacyAndFollowStatus = async (otherUserData: any) => {
    if (!user?.id || !otherUserData) return;

    // Get the target user ID from the otherUserData
    const targetUserId = otherUserData._id || otherUserData.id;
    if (!targetUserId) return;

    // Use the viewer permissions from the API response
    if (otherUserData.viewerPermissions) {
      const permissions = otherUserData.viewerPermissions;
      setCanViewProfile(permissions.canViewProfile || false);
      setCanViewPosts(permissions.canViewPosts || false);
      setCanViewFollowers(permissions.canViewFollowers || false);
      setCanViewFollowing(permissions.canViewFollowing || false);
      setCanMessage(permissions.canMessage || false);
      setCanComment(permissions.canComment || false);
      // Note: Follow status is handled by checkFollowStatus, not here
    } else {
      // Fallback to old logic if viewerPermissions not available
      const privacy = otherUserData.preferences?.privacy;
      const isOwnProfile = user.id === (otherUserData._id || otherUserData.id);
      const isPublic = privacy?.profileVisibility === "public";
      const isFriendsOnly = privacy?.profileVisibility === "friends";
      const isPrivate = privacy?.profileVisibility === "private";

      if (isOwnProfile) {
        setCanViewProfile(true);
        setCanViewPosts(true);
        setCanViewFollowers(true);
        setCanViewFollowing(true);
        setCanFollow(false);
        setCanMessage(false);
        setCanComment(false);
      } else if (isPrivate) {
        // Private profile - only followers can see
        setCanViewProfile(false);
        setCanViewPosts(false);
        setCanViewFollowers(false);
        setCanViewFollowing(false);
        setCanFollow(true);
        setCanMessage(false);
        setCanComment(false);
      } else if (isFriendsOnly) {
        // Friends-only profile
        setCanViewProfile(true);
        setCanViewPosts(false);
        setCanViewFollowers(false);
        setCanViewFollowing(false);
        setCanFollow(true);
        setCanMessage(false);
        setCanComment(false);
      } else {
        // Public profile
        setCanViewProfile(true);
        setCanViewPosts(true);
        setCanViewFollowers(true);
        setCanViewFollowing(true);
        setCanFollow(true);
        setCanMessage(true);
        setCanComment(true);
      }
    }
  };

  const handleFollow = async () => {
    if (!user?.id) {
      return;
    }

    const targetUserId = viewingOtherUser
      ? otherUser?._id || otherUser?.id
      : user?.id;

    if (!targetUserId || targetUserId === user.id) {
      setIsFollowing(false);
      setFollowRequestSent(false);
      setCanFollow(false);
      setFollowStatusLoaded(true);
      warning("Action not allowed", "You cannot follow your own profile.");
      return;
    }

    setFollowLoading(true);
    try {
      // Determine the action and HTTP method
      const isUnfollowing = isFollowing || followRequestSent;
      const method = isUnfollowing ? "DELETE" : "POST";

      const res = await fetch(
        `http://localhost:5000/api/social/users/${targetUserId}/follow`,
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (isUnfollowing) {
          // Unfollow action completed
          setIsFollowing(false);
          setFollowRequestSent(false);
          setCanFollow(true);
          // Show success toast for unfollow
          success(
            "Unfollowed successfully",
            `You are no longer following ${otherUser?.name || "this user"}.`
          );

          // Refresh follow status and posts after unfollow
          if (viewingOtherUser && otherUser) {
            checkFollowStatus(true);
            debouncedFetchUserPosts();
          }

          // Update privacy permissions for private profiles
          if (
            otherUser?.preferences?.privacy?.profileVisibility === "private"
          ) {
            setCanViewProfile(false);
            setCanViewPosts(false);
            setCanViewFollowers(false);
            setCanViewFollowing(false);
            setCanFollow(true);
            setCanMessage(false);
            setCanComment(false);
          }
        } else {
          // Follow action completed
          if (data.data?.hasRequestSent) {
            // Follow request sent for private account
            setFollowRequestSent(true);
            setIsFollowing(false);
            setCanFollow(false);

            // Show success toast for follow request
            success(
              "Follow request sent",
              `Your follow request has been sent to ${
                otherUser?.name || "this user"
              }. You'll be notified when they respond.`
            );

            // Refresh follow status after follow request
            if (viewingOtherUser && otherUser) {
              checkFollowStatus(true);
            }
          } else if (data.data?.isFollowing || data.success) {
            // Direct follow for public account
            setIsFollowing(true);
            setFollowRequestSent(false);
            setCanFollow(false);

            // Show success toast for follow
            success(
              "Followed successfully",
              `You are now following ${otherUser?.name || "this user"}.`
            );

            // Refresh follow status and posts after follow
            if (viewingOtherUser && otherUser) {
              checkFollowStatus(true);
              debouncedFetchUserPosts();
            }

            // Update privacy permissions for private profiles
            if (
              otherUser?.preferences?.privacy?.profileVisibility === "private"
            ) {
              setCanViewProfile(true);
              setCanViewPosts(true);
              setCanViewFollowers(true);
              setCanViewFollowing(true);
              setCanFollow(false);
              setCanMessage(true);
              setCanComment(true);
            }
          }
        }

        // Refresh counts and relationship data after any successful follow action.
        await fetchProfileData();
      } else {
        // Handle error responses
        if (data.message === "You are already following this user") {
          // User is already following, update state accordingly
          setIsFollowing(true);
          setFollowRequestSent(false);
          setCanFollow(false);
          success("Already Following", "You are already following this user.");
        } else if (data.message === "Follow request already sent") {
          // Follow request already sent, update state accordingly
          setFollowRequestSent(true);
          setIsFollowing(false);
          setCanFollow(false);
          success(
            "Request Already Sent",
            "You have already sent a follow request to this user."
          );
        } else {
          // Other errors
          error("Follow Action Failed", data.message || "Something went wrong");
        }
      }
    } catch (err: any) {
      console.error("Error in follow/unfollow action:", err);
      error("Follow Action Failed", "Please try again");
    } finally {
      setFollowLoading(false);
      setFollowStatusLoaded(true);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                  isLiked: !post.isLiked,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setPosts(
          posts.map((post) =>
            post.id === postId ? { ...post, isSaved: !post.isSaved } : post
          )
        );
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) {
      error("Authentication required", "Please log in to delete posts.");
      return;
    }

    setPostToDelete(postId);
    setShowDeleteDialog(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Remove post from both userPosts and posts arrays
        setUserPosts((prev) =>
          prev.filter((post) => post._id !== postToDelete)
        );
        setPosts((prev) => prev.filter((post) => post.id !== postToDelete));

        success("Post deleted", "Your post has been successfully deleted.");
      } else {
        const data = await response.json();
        error("Delete failed", data.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      error("Network error", "Failed to delete post. Please try again.");
    } finally {
      setShowDeleteDialog(false);
      setPostToDelete(null);
    }
  };

  const isViewingSelfProfile = Boolean(
    user?.id &&
      viewingOtherUser &&
      (otherUser?._id || otherUser?.id) === user.id
  );
  const displayUser = viewingOtherUser ? otherUser : user;
  const isOwnProfile = !viewingOtherUser || isViewingSelfProfile;

  const handleMessageUser = async () => {
    if (!user?.id) return;

    // Get the target user ID from the current context
    const targetUserId = viewingOtherUser
      ? otherUser?._id || otherUser?.id
      : user.id;
    if (!targetUserId) return;

    try {
      // First, try to find an existing chat room with this user
      const response = await fetch("http://localhost:5000/api/chat/rooms", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.ok) {
        const data = await response.json();
        const rooms = data.data.chatRooms || [];

        // Find existing direct chat room with this user
        const existingRoom = rooms.find(
          (room: any) =>
            room.type === "direct" &&
            room.participants.some((p: any) => p._id === targetUserId)
        );

        if (existingRoom) {
          // Navigate to existing chat room
          navigate(`/chat/${existingRoom._id}`);
        } else {
          // Create a new direct chat room
          const createResponse = await fetch(
            "http://localhost:5000/api/chat/direct",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                participantId: targetUserId,
              }),
            }
          );

          if (createResponse.ok) {
            const createData = await createResponse.json();
            navigate(`/chat/${createData.data.chatRoom._id}`);
          } else {
            throw new Error("Failed to create chat room");
          }
        }
      } else {
        throw new Error("Failed to fetch chat rooms");
      }
    } catch (err: any) {
      console.error("Error navigating to chat:", err);
      error("Failed to open chat", "Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const socialLinks: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
      } = {};
      if (editProfile.linkedin && editProfile.linkedin.trim()) {
        socialLinks.linkedin = editProfile.linkedin.trim();
      }
      if (editProfile.github && editProfile.github.trim()) {
        socialLinks.github = editProfile.github.trim();
      }
      if (editProfile.portfolio && editProfile.portfolio.trim()) {
        socialLinks.portfolio = editProfile.portfolio.trim();
      }

      const requestBody = {
        name: editProfile.name,
        profile: {
          location: editProfile.location,
          bio: editProfile.bio,
          company: editProfile.company,
          position: editProfile.position,
          socialLinks,
        },
      };

      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();

        await updateProfile(data.data.user);
        setShowEditProfile(false);
        success(
          "Profile Updated Successfully! 🎉",
          "Your profile has been updated and saved. The changes will be visible immediately."
        );
      } else {
        const errorData = await response.json();
        console.error("Profile update failed:", errorData);

        let errorMessage = "Failed to update profile";
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].msg || "Validation error occurred";
        }

        error("Profile Update Failed", errorMessage);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);

      let errorMessage = "Please try again";
      if (err.message) {
        errorMessage = err.message;
      } else if (
        err.name === "TypeError" &&
        err.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      error("Profile Update Failed", errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      error(
        "Invalid file type",
        "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
      );
      return;
    }

    if (file.size > maxSize) {
      error("File too large", "Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setShowImagePreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfilePicture = async () => {
    if (!previewImage) return;

    setUploadingImage(true);
    try {
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const file = new File([blob], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      const imageUrl = await cloudinaryService.uploadProfilePicture(file);
      await updateProfile({ profilePicture: imageUrl });

      setShowImagePreview(false);
      setPreviewImage(null);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      error("Upload failed", "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/social/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: newPostContent,
          type: "achievement",
        }),
      });

      if (response.ok) {
        setNewPostContent("");
        setShowNewPostDialog(false);
        fetchUserPosts();
        success("Post created", "Your post has been created successfully!");
      } else {
        const errorData = await response.json();
        error(
          "Failed to create post",
          errorData.message || "Please try again."
        );
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      error("Failed to create post", "Please try again.");
    }
  };

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-96 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-96 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // Enhanced followers/following functions
  const handleRemoveFollower = async (followerId: string) => {
    if (!user?.id) return;

    setRemovingFollower(followerId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/users/${followerId}/remove-follower`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setFollowers((prev) => prev.filter((f) => f._id !== followerId));
        success(
          "Follower removed",
          "The user has been removed from your followers."
        );
      } else {
        error("Failed to remove follower", "Please try again later.");
      }
    } catch (err: any) {
      console.error("Error removing follower:", err);
      error("Error removing follower", "Please try again.");
    } finally {
      setRemovingFollower(null);
      setShowFollowersDropdown(null);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    if (!user?.id) return;

    setUnfollowingUser(userId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/users/${userId}/unfollow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setFollowing((prev) => prev.filter((f) => f._id !== userId));
        success(
          "Unfollowed successfully",
          "You are no longer following this user."
        );
      } else {
        error("Failed to unfollow user", "Please try again later.");
      }
    } catch (err: any) {
      console.error("Error unfollowing user:", err);
      error("Error unfollowing user", "Please try again.");
    } finally {
      setUnfollowingUser(null);
      setShowFollowingDropdown(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!user?.id) return;

    setBlockingUser(userId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/users/${userId}/block`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Remove from both followers and following lists
        setFollowers((prev) => prev.filter((f) => f._id !== userId));
        setFollowing((prev) => prev.filter((f) => f._id !== userId));
        success("User blocked", "User has been blocked successfully.");
      } else {
        const data = await response.json();
        error(
          "Failed to block user",
          data.message || "Please try again later."
        );
      }
    } catch (err: any) {
      console.error("Error blocking user:", err);
      error("Error blocking user", "Please try again.");
    } finally {
      setBlockingUser(null);
      setShowFollowersDropdown(null);
      setShowFollowingDropdown(null);
    }
  };

  // Filter functions for search
  const filteredFollowers = followers.filter((follower) => {
    const searchLower = followersSearchQuery.toLowerCase();
    return (
      follower.name?.toLowerCase().includes(searchLower) ||
      follower.username?.toLowerCase().includes(searchLower)
    );
  });

  const filteredFollowing = following.filter((followed) => {
    const searchLower = followingSearchQuery.toLowerCase();
    return (
      followed.name?.toLowerCase().includes(searchLower) ||
      followed.username?.toLowerCase().includes(searchLower)
    );
  });

  // Function to refresh followers data when dialog opens
  const handleFollowersDialogOpen = () => {
    setShowFollowersDialog(true);
    // Refresh followers data to ensure it's up-to-date
    if (viewingOtherUser && otherUser) {
      fetchProfileData();
    }
  };

  // Function to refresh following data when dialog opens
  const handleFollowingDialogOpen = () => {
    setShowFollowingDialog(true);
    // Refresh following data to ensure it's up-to-date
    if (viewingOtherUser && otherUser) {
      fetchProfileData();
    }
  };

  // Function to check if current user is following a specific user
  const isUserFollowing = (targetUserId: string) => {
    if (!user || !user.following) return false;
    // Handle both array of User objects and array of strings
    if (Array.isArray(user.following)) {
      return user.following.some((followingUser: any) =>
        typeof followingUser === "string"
          ? followingUser === targetUserId
          : followingUser.id === targetUserId ||
            followingUser._id === targetUserId
      );
    }
    return false;
  };

  // Function to check if a user is following the current user
  const isUserFollowedBy = (targetUserId: string) => {
    if (!user || !user.followers) return false;
    // Handle both array of User objects and array of strings
    if (Array.isArray(user.followers)) {
      return user.followers.some((followerUser: any) =>
        typeof followerUser === "string"
          ? followerUser === targetUserId
          : followerUser.id === targetUserId ||
            followerUser._id === targetUserId
      );
    }
    return false;
  };

  // Function to handle messaging a user from dialogs
  const handleMessageUserFromDialog = (
    targetUserId: string,
    username?: string
  ) => {
    // For now, just show a success message
    // This can be expanded to open a chat or navigate to messaging
    success(
      "Message feature",
      `Message feature for ${username || "user"} will be implemented soon!`
    );
  };

  // Function to handle follow/unfollow from the followers/following dialogs
  const handleFollowUnfollowFromDialog = async (
    targetUserId: string,
    isCurrentlyFollowing: boolean
  ) => {
    if (user?.id && targetUserId === user.id) {
      warning("Action not allowed", "You cannot follow your own profile.");
      return;
    }

    try {
      const method = isCurrentlyFollowing ? "DELETE" : "POST";
      const response = await fetch(
        `http://localhost:5000/api/social/users/${targetUserId}/follow`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await response.json().catch(() => ({}));
        await fetchProfileData();

        success(
          isCurrentlyFollowing
            ? "Unfollowed successfully"
            : "Followed successfully",
          isCurrentlyFollowing
            ? "You have unfollowed this user"
            : "You are now following this user"
        );
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unexpected server response" }));
        error("Action failed", errorData.message || "Please try again");
      }
    } catch (err: any) {
      console.error("Error in follow/unfollow:", err);
      error("Action failed", "Please try again");
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/30 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 p-8 mb-8 relative overflow-hidden transition-colors duration-300"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-purple-900/30 dark:to-blue-900/20 opacity-50"></div>

            {/* Action Buttons - Top Right Corner */}
            <div
              className="absolute top-6 right-6 flex gap-3 z-10"
              style={{ position: "absolute", zIndex: 1000 }}
            >
              {!viewingOtherUser || isViewingSelfProfile ? (
                <>
                  {/* Settings Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.location.pathname.includes("/dashboard")) {
                          window.dispatchEvent(new CustomEvent("showSettings"));
                        } else {
                          navigate("/settings");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (window.location.pathname.includes("/dashboard")) {
                            window.dispatchEvent(
                              new CustomEvent("showSettings")
                            );
                          } else {
                            navigate("/settings");
                          }
                        }
                      }}
                      variant="outline"
                      className="group relative overflow-hidden border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 px-4 py-2 h-10 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                      size="sm"
                      aria-label="Open settings"
                      title="Open settings"
                      type="button"
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                      <Settings className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="relative z-10">Settings</span>
                    </Button>
                  </motion.div>

                  {/* Edit Profile Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEditProfile(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setShowEditProfile(true);
                        }
                      }}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 h-10 flex items-center justify-center text-sm font-medium cursor-pointer transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                      size="sm"
                      aria-label="Edit profile"
                      title="Edit profile"
                      type="button"
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/20 transition-all duration-300"></div>
                      <Edit className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="relative z-10">Edit Profile</span>
                    </Button>
                  </motion.div>

                  {/* Profile Menu Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="relative profile-menu"
                    ref={profileMenuRef}
                    style={{ position: "relative", zIndex: 1000 }}
                  >
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowProfileMenu(!showProfileMenu);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setShowProfileMenu(!showProfileMenu);
                        } else if (e.key === "Escape") {
                          setShowProfileMenu(false);
                        }
                      }}
                      variant="outline"
                      className={`group relative overflow-hidden border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-300 px-3 py-2 h-10 flex items-center justify-center text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white cursor-pointer shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                        showProfileMenu
                          ? "ring-2 ring-blue-500 ring-offset-2"
                          : ""
                      }`}
                      size="sm"
                      aria-label="Profile menu"
                      title="Profile menu"
                      aria-expanded={showProfileMenu}
                      aria-haspopup="true"
                      id="profile-menu-button"
                      type="button"
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 to-gray-500/0 group-hover:from-gray-500/5 group-hover:to-gray-500/10 transition-all duration-300"></div>
                      <MoreVertical
                        className={`h-5 w-5 transition-all duration-300 ${
                          showProfileMenu
                            ? "rotate-90 scale-110"
                            : "group-hover:scale-110"
                        }`}
                      />
                    </Button>

                    {/* Enhanced Profile Menu Dropdown */}
                    <AnimatePresence>
                      {showProfileMenu && (
                        <>
                          {/* Backdrop to prevent click-through */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setShowProfileMenu(false)}
                          />

                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-800/95 border border-gray-200 dark:border-slate-600/50 rounded-xl shadow-2xl z-[9999] backdrop-blur-md overflow-hidden"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="profile-menu-button"
                            style={{
                              position: "absolute",
                              top: "100%",
                              right: "0",
                              marginTop: "12px",
                              zIndex: 9999,
                            }}
                          >
                            {/* Menu Header */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-600/50 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Profile Actions
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Manage your profile and account
                              </p>
                            </div>

                            <div className="py-2">
                              {/* Edit Profile Option */}
                              <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  setShowEditProfile(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setShowProfileMenu(false);
                                    setShowEditProfile(true);
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                                role="menuitem"
                                tabIndex={0}
                              >
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors duration-200">
                                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Edit Profile
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Update your information
                                  </div>
                                </div>
                              </motion.button>

                              {/* Settings Option */}
                              <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  if (
                                    window.location.pathname.includes(
                                      "/dashboard"
                                    )
                                  ) {
                                    window.dispatchEvent(
                                      new CustomEvent("showSettings")
                                    );
                                  } else {
                                    navigate("/settings");
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setShowProfileMenu(false);
                                    if (
                                      window.location.pathname.includes(
                                        "/dashboard"
                                      )
                                    ) {
                                      window.dispatchEvent(
                                        new CustomEvent("showSettings")
                                      );
                                    } else {
                                      navigate("/settings");
                                    }
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                                role="menuitem"
                                tabIndex={0}
                              >
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors duration-200">
                                  <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <div className="font-medium">Settings</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Manage preferences
                                  </div>
                                </div>
                              </motion.button>

                              {/* Achievements Option */}
                              <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  navigate("/follow-requests");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setShowProfileMenu(false);
                                    navigate("/follow-requests");
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                                role="menuitem"
                                tabIndex={0}
                              >
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors duration-200">
                                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                  <div className="font-medium">Follow Requests</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Review pending requests
                                  </div>
                                </div>
                              </motion.button>

                              {/* Achievements Option */}
                              <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  setShowAchievementsDialog(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setShowProfileMenu(false);
                                    setShowAchievementsDialog(true);
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-3 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-inset"
                                role="menuitem"
                                tabIndex={0}
                              >
                                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/40 transition-colors duration-200">
                                  <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    View Achievements
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    See your progress
                                  </div>
                                </div>
                              </motion.button>

                              {/* Separator */}
                              <div className="border-t border-gray-200 dark:border-slate-600 my-2 mx-4"></div>

                              {/* Logout Option */}
                              <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                  setShowProfileMenu(false);
                                  try {
                                    await logout();
                                    success(
                                      "Logged out successfully",
                                      "You have been logged out."
                                    );
                                    window.location.href = "/";
                                  } catch (err: any) {
                                    console.error(
                                      "Error during profile logout:",
                                      err
                                    );
                                    error("Logout failed", "Please try again.");
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    // Trigger logout
                                    setShowProfileMenu(false);
                                    // Note: We can't call async function directly in onKeyDown
                                    // So we'll just close the menu and let the user click
                                  }
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                                role="menuitem"
                                tabIndex={0}
                              >
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors duration-200">
                                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <div className="font-medium">Logout</div>
                                  <div className="text-xs text-red-500 dark:text-red-400">
                                    Sign out of your account
                                  </div>
                                </div>
                              </motion.button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Message Button for Other Users */}
                  {canMessage && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Button
                        onClick={handleMessageUser}
                        variant="outline"
                        className="group relative overflow-hidden border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 px-4 py-2 h-10 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer shadow-sm hover:shadow-md"
                        size="sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                        <MessageCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative z-10">Message</span>
                      </Button>
                    </motion.div>
                  )}

                  {/* Follow Button for Other Users */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    {!followStatusLoaded ? (
                      <FollowButtonSkeleton />
                    ) : (
                      <Button
                        onClick={handleFollow}
                        disabled={
                          followLoading ||
                          (!canFollow && !isFollowing && !followRequestSent)
                        }
                        className={`group relative overflow-hidden transition-all duration-300 px-4 py-2 h-10 flex items-center justify-center text-sm font-medium cursor-pointer shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 ${
                          isFollowing
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : followRequestSent
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        }`}
                        size="sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/20 transition-all duration-300"></div>
                        {followLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : isFollowing ? (
                          <UserMinus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        ) : followRequestSent ? (
                          <Clock className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <UserPlus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        <span className="relative z-10">
                          {followLoading
                            ? "Loading..."
                            : isFollowing
                            ? "Unfollow"
                            : followRequestSent
                            ? "Requested"
                            : "Follow"}
                        </span>
                      </Button>
                    )}
                  </motion.div>
                </>
              )}
            </div>

            {/* Privacy Notice */}
            {viewingOtherUser && !canViewProfile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-600/50 rounded-lg relative z-10">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                      Private Account
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      This account is private.{" "}
                      {followRequestSent
                        ? "Your follow request has been sent. You'll be able to view their profile once they accept."
                        : "Send a follow request to view their profile and posts."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center lg:items-start space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative group"
                  >
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl transition-all duration-300 group-hover:ring-8 group-hover:ring-blue-200 dark:group-hover:ring-purple-400 relative">
                      <img
                        src={
                          displayUser?.profilePicture || "/default-avatar.png"
                        }
                        alt={displayUser?.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-purple-400/40 dark:to-blue-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Profile Info Section */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                          {displayUser?.name || "Loading..."}
                        </h1>

                        {/* Role Badge */}
                        <Badge
                          className={`${
                            displayUser?.role === "admin"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : displayUser?.role === "teacher"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : displayUser?.role === "hr"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          {displayUser?.role
                            ? displayUser.role.toUpperCase()
                            : "STUDENT"}
                        </Badge>

                        {/* Subscription Badge */}
                        {displayUser?.subscription &&
                          displayUser.subscription !== "free" && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              {displayUser.subscription.toUpperCase()}
                            </Badge>
                          )}

                        {/* Verified Badge */}
                        {displayUser?.profile?.verified && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-gray-600 dark:text-gray-400 font-mono">
                        @{displayUser?.username || "username"}
                      </p>
                      {displayUser?.profile?.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{displayUser.profile.location}</span>
                        </div>
                      )}
                      {displayUser?.profile?.bio && (
                        <p className="text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">
                          {displayUser.profile.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  {canViewProfile && (
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div
                        className="text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md dark:hover:shadow-slate-900/50"
                        onClick={handleFollowersDialogOpen}
                      >
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {followers?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-300">
                          Followers
                        </div>
                      </div>
                      <div
                        className="text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md dark:hover:shadow-slate-900/50"
                        onClick={handleFollowingDialogOpen}
                      >
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {following?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-300">
                          Following
                        </div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {userPosts?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-300">
                          Posts
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {canViewProfile && displayUser?.profile?.socialLinks && (
                    <div className="flex gap-3 pt-2">
                      {displayUser.profile.socialLinks.linkedin && (
                        <a
                          href={displayUser.profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        </a>
                      )}
                      {displayUser.profile.socialLinks.github && (
                        <a
                          href={displayUser.profile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Github className="h-4 w-4 text-gray-600" />
                        </a>
                      )}
                      {displayUser.profile.socialLinks.portfolio && (
                        <a
                          href={displayUser.profile.socialLinks.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Globe className="h-4 w-4 text-purple-600" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Statistics Section */}
          {canViewProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 p-6 mb-8 transition-colors duration-300"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Zap className="h-6 w-6 text-yellow-600" />}
                  label="Problems Solved"
                  value={userStats.problemsSolved}
                  color="yellow"
                />
                <StatCard
                  icon={<Mic className="h-6 w-6 text-blue-600" />}
                  label="Mock Interviews"
                  value={userStats.mockInterviews}
                  color="blue"
                />
                <StatCard
                  icon={<Flame className="h-6 w-6 text-orange-600" />}
                  label="Current Streak"
                  value={userStats.currentStreak}
                  color="orange"
                />
                <div
                  className="flex flex-col items-center justify-center space-y-2 cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    setShowAchievementsDialog(true);
                  }}
                >
                  <div className="flex gap-1">
                    <Medal className="h-4 w-4 text-yellow-600" />
                    <Target className="h-4 w-4 text-blue-600" />
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <Flame className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.achievements}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Achievements
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Section */}
          {canViewProfile ? (
            <div className="space-y-8">
              {/* New Post Creation Section */}
              {isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <PostCreator
                    onPostCreated={(post) => {
                      setUserPosts((prev) => [post, ...prev]);
                      success("Post created!", "Your post has been published.");
                    }}
                    placeholder={`What's on your mind, ${displayUser?.name}?`}
                  />
                </motion.div>
              )}

              {/* Content Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/95 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300"
              >
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="border-b border-gray-200 dark:border-slate-700">
                    <div className="flex space-x-8 px-6">
                      <button
                        onClick={() => setActiveTab("posts")}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeTab === "posts"
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setActiveTab("activity")}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeTab === "activity"
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Activity
                      </button>
                      <button
                        onClick={() => setActiveTab("saved")}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeTab === "saved"
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Saved
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === "posts" && (
                      <div className="space-y-4">
                        {/* View Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Posts
                          </h3>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                            <button
                              onClick={() => setViewMode("grid")}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                viewMode === "grid"
                                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                              }`}
                            >
                              <Grid3X3 className="h-4 w-4" />
                              Grid
                            </button>
                            <button
                              onClick={() => setViewMode("list")}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                viewMode === "list"
                                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                              }`}
                            >
                              <List className="h-4 w-4" />
                              List
                            </button>
                          </div>
                        </div>

                        {loadingPosts ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Loading posts...
                            </p>
                          </div>
                        ) : userPosts.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              No posts yet
                            </h3>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto"
                            >
                              {isOwnProfile
                                ? "Start sharing your thoughts and experiences!"
                                : "This user hasn't posted anything yet."}
                            </motion.p>
                            {isOwnProfile && (
                              <Button
                                onClick={() => setShowNewPostDialog(true)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Create your
                                first post
                              </Button>
                            )}
                          </motion.div>
                        ) : (
                          <div
                            className={
                              viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                                : "space-y-4"
                            }
                          >
                            {userPosts &&
                              Array.isArray(userPosts) &&
                              userPosts.map((post, index) => {
                                // Ensure post is an object and has required properties
                                if (!post || typeof post !== "object") {
                                  return null;
                                }

                                return (
                                  <motion.div
                                    key={post._id || `post-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.5,
                                      delay: 0.1 * index,
                                    }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="group"
                                  >
                                    <Card
                                      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-slate-800/95 dark:to-slate-700/95 backdrop-blur-sm group-hover:scale-105 group-hover:-translate-y-1 ${
                                        viewMode === "list" ? "max-w-none" : ""
                                      }`}
                                    >
                                      <CardContent
                                        className={`${
                                          viewMode === "list" ? "p-4" : "p-6"
                                        }`}
                                      >
                                        <div
                                          className={`flex items-start gap-4 ${
                                            viewMode === "list"
                                              ? "flex-row"
                                              : "flex-col"
                                          }`}
                                        >
                                          <Avatar
                                            className={`${
                                              viewMode === "list"
                                                ? "h-10 w-10"
                                                : "h-12 w-12"
                                            } flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-900`}
                                          >
                                            <AvatarImage
                                              src={displayUser?.profilePicture}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                              {displayUser?.name?.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div
                                            className={`flex-1 space-y-4 ${
                                              viewMode === "list"
                                                ? "min-w-0"
                                                : ""
                                            }`}
                                          >
                                            <div
                                              className={`flex items-center justify-between ${
                                                viewMode === "list"
                                                  ? "flex-wrap gap-2"
                                                  : ""
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                  {safeRender(
                                                    post.user?.name ||
                                                      displayUser?.name,
                                                    "Unknown User"
                                                  )}
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className={`text-xs ${
                                                    post.type === "achievement"
                                                      ? "border-green-200 text-green-700 dark:border-green-700 dark:text-green-300"
                                                      : post.type === "question"
                                                      ? "border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300"
                                                      : post.type === "resource"
                                                      ? "border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                                                      : "border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                                                  }`}
                                                >
                                                  {post.type || "post"}
                                                </Badge>
                                              </div>
                                              <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                {post.createdAt
                                                  ? new Date(
                                                      post.createdAt
                                                    ).toLocaleDateString()
                                                  : "Unknown date"}
                                              </span>
                                            </div>

                                            <div className="relative">
                                              <p
                                                className={`text-gray-700 dark:text-slate-200 leading-relaxed break-words ${
                                                  viewMode === "list"
                                                    ? "line-clamp-2 text-sm"
                                                    : "line-clamp-3"
                                                }`}
                                                style={{
                                                  wordBreak: "break-word",
                                                  overflowWrap: "break-word",
                                                }}
                                              >
                                                {safeRender(
                                                  post.content,
                                                  "No content"
                                                )}
                                              </p>
                                              {post.image && (
                                                <div
                                                  className={`mt-3 rounded-lg overflow-hidden ${
                                                    viewMode === "list"
                                                      ? "max-w-xs"
                                                      : ""
                                                  }`}
                                                >
                                                  <img
                                                    src={post.image}
                                                    alt="Post attachment"
                                                    className={`object-cover hover:scale-105 transition-transform duration-300 ${
                                                      viewMode === "list"
                                                        ? "w-32 h-20"
                                                        : "w-full h-32"
                                                    }`}
                                                  />
                                                </div>
                                              )}
                                            </div>

                                            <div
                                              className={`flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700 ${
                                                viewMode === "list"
                                                  ? "flex-wrap gap-2"
                                                  : ""
                                              }`}
                                            >
                                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                                                <button
                                                  onClick={() =>
                                                    handleLike(post._id)
                                                  }
                                                  className="flex items-center gap-1 hover:text-red-500 transition-all duration-200 hover:scale-110"
                                                >
                                                  <Heart
                                                    className={`h-4 w-4 ${
                                                      post.isLiked
                                                        ? "fill-red-500 text-red-500"
                                                        : ""
                                                    }`}
                                                  />
                                                  <span className="text-xs">
                                                    {safeRender(
                                                      Array.isArray(post.likes)
                                                        ? post.likes.length
                                                        : post.likes,
                                                      "0"
                                                    )}
                                                  </span>
                                                </button>
                                                <button className="flex items-center gap-1 hover:text-blue-500 transition-all duration-200 hover:scale-110">
                                                  <MessageSquare className="h-4 w-4" />
                                                  <span className="text-xs">
                                                    {safeRender(
                                                      Array.isArray(
                                                        post.comments
                                                      )
                                                        ? post.comments.length
                                                        : post.comments,
                                                      "0"
                                                    )}
                                                  </span>
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    handleSave(post._id)
                                                  }
                                                  className="flex items-center gap-1 hover:text-yellow-500 transition-all duration-200 hover:scale-110"
                                                >
                                                  <Bookmark
                                                    className={`h-4 w-4 ${
                                                      post.isSaved
                                                        ? "fill-yellow-500 text-yellow-500"
                                                        : ""
                                                    }`}
                                                  />
                                                </button>
                                                <button className="flex items-center gap-1 hover:text-green-500 transition-all duration-200 hover:scale-110">
                                                  <Share2 className="h-4 w-4" />
                                                </button>
                                              </div>

                                              {/* Show delete button only for user's own posts */}
                                              {post.user?._id === user?.id && (
                                                <button
                                                  onClick={() =>
                                                    handleDeletePost(post._id)
                                                  }
                                                  className="flex items-center gap-1 hover:text-red-500 transition-all duration-200 hover:scale-110 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  title="Delete post"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "activity" && (
                      <div className="text-center py-12">
                        <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Activity Feed
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Track your recent activities, achievements, and
                          progress here.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Trophy className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Achievement Unlocked
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Solved 100 problems
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                  <Target className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Mock Interview
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Completed interview #25
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Flame className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Streak Extended
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    42 days and counting!
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {activeTab === "saved" && (
                      <div className="text-center py-12">
                        <BookmarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Saved Items
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Your bookmarked posts, resources, and important
                          content will appear here.
                        </p>
                        <Button
                          onClick={() => setActiveTab("posts")}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Browse Posts
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 p-12 text-center"
            >
              <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Private Profile
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This profile is private. Send a follow request to view their
                content.
              </p>
              <Button
                onClick={handleFollow}
                disabled={followLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {followLoading ? "Loading..." : "Send Follow Request"}
              </Button>
            </motion.div>
          )}

          <Dialog
            open={showFollowersDialog}
            onOpenChange={setShowFollowersDialog}
          >
            <DialogContent
              className="max-w-lg max-h-[80vh] overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl"
              data-dialog-content
            >
              <DialogHeader className="pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Followers ({filteredFollowers.length})
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowersDialog(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Enhanced Search Bar */}
              <div className="mb-4 px-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search followers by name or username..."
                    value={followersSearchQuery}
                    onChange={(e) => setFollowersSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 h-11 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  {followersSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFollowersSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-96 pr-2 [&_.simplebar-track]:hidden [&_.simplebar-thumb]:hidden">
                <div className="space-y-2">
                  {loadingFollowers ? (
                    <FollowersListSkeleton />
                  ) : filteredFollowers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {followersSearchQuery
                          ? "No followers found"
                          : "No followers yet"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {followersSearchQuery
                          ? "Try adjusting your search terms"
                          : "When people follow you, they'll appear here"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {filteredFollowers.map((follower) => {
                        if (!follower || typeof follower !== "object") {
                          return null;
                        }

                        return (
                          <motion.div
                            key={follower._id || `follower-${Math.random()}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                          >
                            <Avatar
                              className="h-12 w-12 cursor-pointer ring-2 ring-gray-200 dark:ring-slate-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all duration-200"
                              onClick={() => {
                                setShowFollowersDialog(false);
                                navigateToProfile(
                                  follower.username || follower._id
                                );
                              }}
                            >
                              <AvatarImage src={follower.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {follower.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => {
                                setShowFollowersDialog(false);
                                navigateToProfile(
                                  follower.username || follower._id
                                );
                              }}
                            >
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {safeRender(follower.name, "Unknown User")}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                @{safeRender(follower.username, "unknown")}
                              </p>
                              {follower.profile?.bio && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                  {follower.profile.bio}
                                </p>
                              )}
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Follow/Unfollow Button */}
                              {!viewingOtherUser && (
                                <Button
                                  variant={
                                    isUserFollowing(follower._id)
                                      ? "outline"
                                      : "default"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    handleFollowUnfollowFromDialog(
                                      follower._id,
                                      isUserFollowing(follower._id)
                                    )
                                  }
                                  className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                                    isUserFollowing(follower._id)
                                      ? "border-red-300 dark:border-red-600 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                                >
                                  {isUserFollowing(follower._id)
                                    ? "Unfollow"
                                    : isUserFollowedBy(follower._id)
                                    ? "Follow Back"
                                    : "Follow"}
                                </Button>
                              )}

                              {/* Message Button */}
                              {!viewingOtherUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMessageUserFromDialog(
                                      follower._id,
                                      follower.username
                                    )
                                  }
                                  className="h-8 px-3 text-xs font-medium border-gray-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 text-gray-700 dark:text-gray-300 transition-all duration-200"
                                >
                                  Message
                                </Button>
                              )}

                              {/* Enhanced Dropdown Menu */}
                              <div className="relative dropdown-menu">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowFollowersDropdown(
                                      showFollowersDropdown === follower._id
                                        ? null
                                        : follower._id
                                    )
                                  }
                                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>

                                {showFollowersDropdown === follower._id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-[9999] dropdown-menu"
                                  >
                                    <div className="py-2">
                                      <button
                                        onClick={() =>
                                          handleRemoveFollower(follower._id)
                                        }
                                        disabled={
                                          removingFollower === follower._id
                                        }
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <UserMinus className="h-4 w-4" />
                                        {removingFollower === follower._id
                                          ? "Removing..."
                                          : "Remove Follower"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleBlockUser(follower._id)
                                        }
                                        disabled={blockingUser === follower._id}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <Shield className="h-4 w-4" />
                                        {blockingUser === follower._id
                                          ? "Blocking..."
                                          : "Block User"}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Following Dialog */}
          <Dialog
            open={showFollowingDialog}
            onOpenChange={setShowFollowingDialog}
          >
            <DialogContent
              className="max-w-lg max-h-[80vh] overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl"
              data-dialog-content
            >
              <DialogHeader className="pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Following ({filteredFollowing.length})
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowingDialog(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Enhanced Search Bar */}
              <div className="mb-4 px-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search following by name or username..."
                    value={followingSearchQuery}
                    onChange={(e) => setFollowingSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 h-11 border-gray-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400"
                  />
                  {followingSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFollowingSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-96 pr-2 [&_.simplebar-track]:hidden [&_.simplebar-thumb]:hidden">
                <div className="space-y-2">
                  {loadingFollowing ? (
                    <FollowersListSkeleton />
                  ) : filteredFollowing.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {followingSearchQuery
                          ? "No following found"
                          : "Not following anyone yet"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {followingSearchQuery
                          ? "Try adjusting your search terms"
                          : "Start following people to see their updates here"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {filteredFollowing.map((followed) => {
                        if (!followed || typeof followed !== "object") {
                          return null;
                        }

                        return (
                          <motion.div
                            key={followed._id || `followed-${Math.random()}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                          >
                            <Avatar
                              className="h-12 w-12 cursor-pointer ring-2 ring-gray-200 dark:ring-slate-700 group-hover:ring-green-300 dark:group-hover:ring-green-600 transition-all duration-200"
                              onClick={() => {
                                setShowFollowingDialog(false);
                                navigateToProfile(
                                  followed.username || followed._id
                                );
                              }}
                            >
                              <AvatarImage src={followed.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                                {followed.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => {
                                setShowFollowingDialog(false);
                                navigateToProfile(
                                  followed.username || followed._id
                                );
                              }}
                            >
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {safeRender(followed.name, "Unknown User")}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                @{safeRender(followed.username, "unknown")}
                              </p>
                              {followed.profile?.bio && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                  {followed.profile.bio}
                                </p>
                              )}
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Unfollow Button */}
                              {!viewingOtherUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleFollowUnfollowFromDialog(
                                      followed._id,
                                      true
                                    )
                                  }
                                  className="h-8 px-3 text-xs font-medium border-red-300 dark:border-red-600 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 transition-all duration-200"
                                >
                                  Unfollow
                                </Button>
                              )}

                              {/* Message Button */}
                              {!viewingOtherUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleMessageUserFromDialog(
                                      followed._id,
                                      followed.username
                                    )
                                  }
                                  className="h-8 px-3 text-xs font-medium border-gray-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 text-gray-700 dark:text-gray-300 transition-all duration-200"
                                >
                                  Message
                                </Button>
                              )}

                              {/* Enhanced Dropdown Menu */}
                              <div className="relative dropdown-menu">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowFollowingDropdown(
                                      showFollowingDropdown === followed._id
                                        ? null
                                        : followed._id
                                    )
                                  }
                                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>

                                {showFollowingDropdown === followed._id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-[9999] dropdown-menu"
                                  >
                                    <div className="py-2">
                                      <button
                                        onClick={() =>
                                          handleUnfollowUser(followed._id)
                                        }
                                        disabled={
                                          unfollowingUser === followed._id
                                        }
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <UserMinus className="h-4 w-4" />
                                        {unfollowingUser === followed._id
                                          ? "Unfollowing..."
                                          : "Unfollow"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleBlockUser(followed._id)
                                        }
                                        disabled={blockingUser === followed._id}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <Shield className="h-4 w-4" />
                                        {blockingUser === followed._id
                                          ? "Blocking..."
                                          : "Block User"}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Edit Profile Dialog */}
          <Dialog open={showEditProfile}>
            <DialogContent
              className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-2xl relative"
              onOpenChange={setShowEditProfile}
            >
              {/* Loading Overlay */}
              {savingProfile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg"
                >
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      Saving Profile...
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Please wait while we update your information
                    </p>
                  </div>
                </motion.div>
              )}

              <DialogHeader className="pb-6 border-b border-gray-200 dark:border-slate-700">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  Edit Profile
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
                  Update your profile information and make it stand out
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-8">
                {/* Profile Picture Section */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile Picture
                  </Label>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-slate-800 shadow-xl">
                        <AvatarImage
                          src={previewImage || displayUser?.profilePicture}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {displayUser?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 bg-white dark:bg-slate-800 border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-lg"
                        onClick={() =>
                          document
                            .getElementById("profile-picture-input")
                            ?.click()
                        }
                      >
                        <Camera className="h-5 w-5 text-blue-600" />
                      </Button>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300"></div>
                    </div>

                    <input
                      id="profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {previewImage && (
                      <motion.div
                        className="flex gap-3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          size="sm"
                          onClick={handleSaveProfilePicture}
                          disabled={uploadingImage}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Picture
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewImage(null);
                            setShowImagePreview(false);
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Basic Information */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={editProfile.name}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter your full name"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="location"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={editProfile.location}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              location: e.target.value,
                            })
                          }
                          placeholder="City, Country"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="bio"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={editProfile.bio}
                        onChange={(e) =>
                          setEditProfile({
                            ...editProfile,
                            bio: e.target.value,
                          })
                        }
                        placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                        rows={4}
                        className="border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Professional Information */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                        <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Professional Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="company"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Company
                        </Label>
                        <Input
                          id="company"
                          value={editProfile.company}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              company: e.target.value,
                            })
                          }
                          placeholder="Your company or organization"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="position"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Position
                        </Label>
                        <Input
                          id="position"
                          value={editProfile.position}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              position: e.target.value,
                            })
                          }
                          placeholder="Your role or position"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Social Links */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                        <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Social Links
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label
                          htmlFor="linkedin"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                          <Linkedin className="h-4 w-4 text-blue-600" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={editProfile.linkedin}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              linkedin: e.target.value,
                            })
                          }
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="github"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                          <Github className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                          GitHub
                        </Label>
                        <Input
                          id="github"
                          value={editProfile.github}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              github: e.target.value,
                            })
                          }
                          placeholder="https://github.com/yourusername"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="portfolio"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4 text-purple-600" />
                          Portfolio
                        </Label>
                        <Input
                          id="portfolio"
                          value={editProfile.portfolio}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              portfolio: e.target.value,
                            })
                          }
                          placeholder="https://yourportfolio.com"
                          className="h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    {savingProfile ? "Saving Changes..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProfile(false)}
                    className="h-12 px-8 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Post Dialog */}
          <Dialog open={showNewPostDialog}>
            <DialogContent
              className="max-w-2xl"
              onOpenChange={setShowNewPostDialog}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Post
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={displayUser?.profilePicture} />
                    <AvatarFallback>
                      {displayUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Document
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPostDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Image Preview Dialog */}
          <Dialog open={showImagePreview}>
            <DialogContent
              className="max-w-2xl"
              onOpenChange={setShowImagePreview}
            >
              <DialogHeader>
                <DialogTitle>Preview Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {previewImage && (
                  <div className="flex justify-center">
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveProfilePicture}
                    disabled={uploadingImage}
                    className="flex-1"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {uploadingImage ? "Uploading..." : "Save Picture"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImagePreview(false);
                      setPreviewImage(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Achievements Dialog */}
          <Dialog open={showAchievementsDialog}>
            <DialogContent
              className="max-w-2xl"
              onOpenChange={setShowAchievementsDialog}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Achievements ({userStats.achievements})
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96 [&_.simplebar-track]:hidden [&_.simplebar-thumb]:hidden">
                <div className="space-y-4">
                  {/* Sample Achievements - Replace with real data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Medal className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          First Post
                        </h4>
                        <p className="text-sm text-gray-600">
                          Created your first post
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 2 days ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Goal Setter
                        </h4>
                        <p className="text-sm text-gray-600">
                          Set your first learning goal
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 1 week ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="p-2 bg-green-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Consistent Learner
                        </h4>
                        <p className="text-sm text-gray-600">
                          7-day learning streak
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 3 days ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Flame className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">On Fire</h4>
                        <p className="text-sm text-gray-600">
                          30-day learning streak
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 2 weeks ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Crown className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Community Leader
                        </h4>
                        <p className="text-sm text-gray-600">
                          Helped 10 other learners
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 1 month ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <div className="p-2 bg-indigo-100 rounded-full">
                        <BadgeCheck className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Verified Expert
                        </h4>
                        <p className="text-sm text-gray-600">
                          Completed advanced certification
                        </p>
                        <p className="text-xs text-gray-500">
                          Unlocked 2 months ago
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">
                      Keep learning to unlock more achievements!
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePage;
