import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  FireIcon,
  QuestionMarkCircleIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  Cog6ToothIcon as Settings,
  BookOpenIcon,
  HeartIcon,
  UserPlusIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Eye, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast, ToastContainer } from "../ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { apiClient } from "../../lib/apiClient";

// Import page components
import FeedPage from "./pages/FeedPage";
import TrendingPage from "./pages/TrendingPage";
import QuestionsPage from "./pages/QuestionsPage";
import CodingPage from "./pages/CodingPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AICompanionPage from "./pages/AICompanionPage";
import FollowRequestsPage from "./pages/FollowRequestsPage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  badges?: string[];
  followers?: number;
  following?: number;
  posts?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Notification {
  _id: string;
  type:
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "like"
  | "comment"
  | "mention"
  | "achievement";
  message: string;
  userId: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  postId?: string;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_MIN_FETCH_MS = 15000;
let notificationsFetchInFlight = false;
let notificationsLastFetchAt = 0;
let notificationsCache: Notification[] = [];
let notificationsUnreadCache = 0;
let notificationsCacheUserId: string | null = null;

interface StudentDashboardProps {
  onLogout?: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toasts, success, error: showError, warning, info, removeToast } =
    useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({
    users: [],
    posts: [],
    questions: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>(
    () => notificationsCache
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    () => notificationsUnreadCache
  );

  // Determine current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/follow-requests")) return "follow-requests";
    if (path.startsWith("/chat")) return "chat";
    if (path.startsWith("/settings")) return "settings";
    if (path.startsWith("/feed")) return "feed";
    if (path.startsWith("/trending")) return "trending";
    if (path.startsWith("/questions")) return "questions";
    if (path.startsWith("/coding")) return "coding";
    if (path.startsWith("/ai-companion")) return "ai-companion";
    return "feed"; // default
  };

  // Get URL parameters for pages that need them
  const getUrlParams = () => {
    const path = location.pathname;
    const params: any = {};

    // Extract username from profile URL
    if (path.startsWith("/profile/")) {
      const match = path.match(/\/profile\/(.+)/);
      if (match) {
        params.username = match[1];
      }
    }

    // Extract userId from chat URL
    if (path.startsWith("/chat/")) {
      const match = path.match(/\/chat\/(.+)/);
      if (match) {
        params.userId = match[1];
      }
    }

    return params;
  };

  const currentPage = getCurrentPage();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Perform search across users, posts, and questions
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ users: [], posts: [], questions: [] });
      setShowSearchResults(false);
      return;
    }

    console.log("Performing search for:", searchQuery);
    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const [usersResponse, postsResponse] = await Promise.all([
        apiClient.fetch(
          `/users/search?q=${encodeURIComponent(
            searchQuery
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        apiClient.fetch(
          `/social/posts/search?q=${encodeURIComponent(
            searchQuery
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
      ]);

      console.log("Users response status:", usersResponse.status);
      console.log("Posts response status:", postsResponse.status);

      const results = {
        users: [],
        posts: [],
        questions: [],
      };

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log("Users data:", usersData);
        results.users = usersData.data?.users || [];
      } else {
        console.error("Users search failed:", usersResponse.status);
      }

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        console.log("Posts data:", postsData);
        const posts = postsData.data?.posts || [];

        // Separate posts into regular posts and questions
        results.posts = posts.filter((post: any) => post.type !== "question");
        results.questions = posts.filter(
          (post: any) => post.type === "question"
        );
      } else {
        console.error("Posts search failed:", postsResponse.status);
      }

      console.log("Final search results:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Debounced search function
  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500); // 500ms debounce
  }, [performSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      debouncedSearch();
    } else {
      setShowSearchResults(false);
      setSearchResults({ users: [], posts: [], questions: [] });
    }
  };

  // Handle search result click
  const handleSearchResultClick = (type: string, item: any) => {
    setSearchQuery("");
    setShowSearchResults(false);

    switch (type) {
      case "user":
        // Navigate to user profile with the username
        navigate(`/profile/${item.username}`);
        break;
      case "post":
        navigate("/feed");
        // Navigate to specific post
        break;
      case "question":
        navigate("/questions");
        // Navigate to specific question
        break;
    }
  };

  // Handle click outside search results
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest(".search-container")) {
      setShowSearchResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for settings navigation from profile page
  useEffect(() => {
    const handleShowSettings = () => {
      navigate("/settings");
    };

    const handleShowChat = (event: CustomEvent) => {
      navigate("/chat");
      // You can store the userId in state if needed for the chat
      console.log("Opening chat with user:", event.detail?.userId);
    };

    window.addEventListener("showSettings", handleShowSettings);
    window.addEventListener("showChat", handleShowChat as EventListener);

    return () => {
      window.removeEventListener("showSettings", handleShowSettings);
      window.removeEventListener("showChat", handleShowChat as EventListener);
    };
  }, [navigate]);

  useEffect(() => {
    const currentUserId = user?.id || null;

    if (!currentUserId) {
      notificationsFetchInFlight = false;
      notificationsLastFetchAt = 0;
      notificationsCache = [];
      notificationsUnreadCache = 0;
      notificationsCacheUserId = null;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (notificationsCacheUserId !== currentUserId) {
      notificationsFetchInFlight = false;
      notificationsLastFetchAt = 0;
      notificationsCache = [];
      notificationsUnreadCache = 0;
      notificationsCacheUserId = currentUserId;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;
    const now = Date.now();

    if (notificationsFetchInFlight) {
      return;
    }

    if (
      !force &&
      now - notificationsLastFetchAt < NOTIFICATION_MIN_FETCH_MS
    ) {
      return;
    }

    notificationsFetchInFlight = true;

    try {
      const response = await apiClient.fetch(`/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const incomingNotifications =
          data.notifications || data.data?.notifications || [];
        const incomingUnreadCount =
          incomingNotifications.filter((n: Notification) => !n.read).length || 0;

        notificationsCache = incomingNotifications;
        notificationsUnreadCache = incomingUnreadCount;
        notificationsLastFetchAt = Date.now();

        setNotifications(incomingNotifications);
        setUnreadCount(incomingUnreadCount);
      } else {
        console.error("Failed to fetch notifications:", response.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      notificationsFetchInFlight = false;
    }
  }, []);

  const handleNotificationsOpenChange = useCallback(
    (open: boolean) => {
      setShowNotifications(open);

      if (open) {
        void fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.fetch(
        `/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const next = prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          );
          notificationsCache = next;
          return next;
        });
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          notificationsUnreadCache = next;
          return next;
        });
        info("Notification marked as read");
      }
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      showError("Failed to mark notification as read", "Please try again.");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await apiClient.fetch(
        `/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const next = prev.map((n) => ({ ...n, read: true }));
          notificationsCache = next;
          return next;
        });
        notificationsUnreadCache = 0;
        setUnreadCount(0);
        success("All notifications marked as read");
      }
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      showError("Failed to mark notifications as read", "Please try again.");
    }
  };

  const handleFollowRequestAction = async (
    notification: Notification,
    action: "accept" | "reject"
  ) => {
    try {
      const requesterId = notification.userId || notification.user?._id;
      if (!requesterId) {
        showError("Follow request error", "Missing requester details.");
        return;
      }

      const response = await apiClient.fetch(
        `/social/users/${requesterId}/${action}-follow-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to ${action} follow request`);
      }

      setNotifications((prev) => {
        const next = prev.filter((n) => n._id !== notification._id);
        notificationsCache = next;
        return next;
      });
      if (!notification.read) {
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          notificationsUnreadCache = next;
          return next;
        });
      }

      success(
        action === "accept" ? "Follow request accepted" : "Follow request rejected",
        `${notification.user?.name || "User"} has been ${action === "accept" ? "accepted" : "rejected"
        }.`
      );
    } catch (err: any) {
      console.error(`Error trying to ${action} follow request:`, err);
      showError(
        `Failed to ${action} follow request`,
        err?.message || "Please try again."
      );
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlusIcon className="h-4 w-4 text-blue-500" />;
      case "follow_request":
        return <UserPlusIcon className="h-4 w-4 text-orange-500" />;
      case "follow_accepted":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "like":
        return <HeartIcon className="h-4 w-4 text-red-500" />;
      case "comment":
        return <ChatBubbleLeftIcon className="h-4 w-4 text-green-500" />;
      case "mention":
        return <ChatBubbleLeftIcon className="h-4 w-4 text-purple-500" />;
      case "achievement":
        return <AcademicCapIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <BellIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "follow":
      case "follow_request":
      case "follow_accepted":
        navigate(`/profile/${notification.user.username}`);
        break;
      case "like":
      case "comment":
      case "mention":
        if (notification.postId) {
          // Navigate to the post (you might need to implement this)
          console.log("Navigate to post:", notification.postId);
        }
        break;
      case "achievement":
        navigate("/profile");
        break;
    }
    setShowNotifications(false);
  };

  // Enhanced notification display component with hover actions
  const NotificationItem = ({
    notification,
  }: {
    notification: Notification;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
    };

    return (
      <div
        className={`group relative p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.read ? "bg-blue-50/50" : ""
          }`}
        onClick={() => handleNotificationClick(notification)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Unread indicator */}
        {!notification.read && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-gray-200">
            <AvatarImage src={notification.user.profilePicture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {notification.user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {notification.user.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(notification.createdAt)}
              </span>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>

            {/* Action buttons - only show on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 pt-1"
                >
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notification._id);
                      }}
                      className="h-6 px-2 text-xs hover:bg-blue-100"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Mark read
                    </Button>
                  )}

                  {notification.type === "follow_request" && (
                    <>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequestAction(notification, "accept");
                        }}
                        className="h-6 px-2 text-xs bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowRequestAction(notification, "reject");
                        }}
                        className="h-6 px-2 text-xs hover:bg-red-100"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  // Fetch notifications on component mount
  useEffect(() => {
    void fetchNotifications();

    const handleWindowFocus = () => {
      void fetchNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const handleLogout = async () => {
    try {
      console.log("=== DASHBOARD LOGOUT CALLED ===");

      // Call the async logout function
      await logout();

      success("Logged out successfully", "You have been logged out.");

      // Redirect after successful logout
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("Error during dashboard logout:", err);
      showError("Logout failed", "Please try again.");
    }
  };

  const navigationItems = [
    { id: "feed", name: "Feed", icon: HomeIcon },
    { id: "trending", name: "Trending", icon: FireIcon },
    { id: "questions", name: "Questions", icon: QuestionMarkCircleIcon },
    { id: "coding", name: "Coding", icon: CodeBracketIcon },
    { id: "chat", name: "Chat", icon: ChatBubbleLeftRightIcon },
    { id: "follow-requests", name: "Follow Requests", icon: UserPlusIcon },
    { id: "ai-companion", name: "AI Companion", icon: SparklesIcon },
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const canOpenAdminConsole =
    user?.role === "admin" || Boolean(user?.adminRole);

  if (canOpenAdminConsole) {
    navigationItems.splice(7, 0, {
      id: "admin-console",
      name: "Admin Console",
      icon: ShieldCheckIcon,
    });
  }

  const mobileNavigationItems = [
    { id: "feed", name: "Feed", icon: HomeIcon },
    { id: "chat", name: "Chat", icon: ChatBubbleLeftRightIcon },
    { id: "trending", name: "Trending", icon: FireIcon },
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  if (canOpenAdminConsole) {
    mobileNavigationItems[4] = {
      id: "admin-console",
      name: "Admin",
      icon: ShieldCheckIcon,
    };
  }

  const navigateToPage = (pageId: string) => {
    switch (pageId) {
      case "feed":
        navigate("/feed");
        break;
      case "trending":
        navigate("/trending");
        break;
      case "questions":
        navigate("/questions");
        break;
      case "coding":
        navigate("/coding");
        break;
      case "chat":
        navigate("/chat");
        break;
      case "follow-requests":
        navigate("/follow-requests");
        break;
      case "ai-companion":
        navigate("/ai-companion");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "admin-console":
        navigate("/admin");
        break;
      default:
        navigate("/feed");
    }
  };

  const renderPage = () => {
    const urlParams = getUrlParams();

    switch (currentPage) {
      case "feed":
        return <FeedPage />;
      case "trending":
        return <TrendingPage user={user} />;
      case "questions":
        return <QuestionsPage user={user} />;
      case "coding":
        return <CodingPage user={user} />;
      case "chat":
        return <ChatPage />;
      case "follow-requests":
        return <FollowRequestsPage />;
      case "ai-companion":
        return <AICompanionPage user={user} />;
      case "profile":
        return <ProfilePage username={urlParams.username} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="h-screen overflow-hidden bg-background text-foreground">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  P
                </span>
              </div>
              <span className="font-bold text-xl">PrepMate</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8 relative search-container">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, posts, questions..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              {showSearchResults && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-1">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.users.length > 0 ||
                    searchResults.posts.length > 0 ||
                    searchResults.questions.length > 0 ? (
                    <>
                      {searchResults.users.length > 0 && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Users
                          </h3>
                          {searchResults.users.map((user: any) => (
                            <div
                              key={user.id}
                              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                              onClick={() =>
                                handleSearchResultClick("user", user)
                              }
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={user.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {user.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.posts.length > 0 && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Posts
                          </h3>
                          {searchResults.posts.map((post: any) => (
                            <div
                              key={post.id}
                              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                              onClick={() =>
                                handleSearchResultClick("post", post)
                              }
                            >
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-2">
                                <BookOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {post.content?.substring(0, 50)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.questions.length > 0 && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Questions
                          </h3>
                          {searchResults.questions.map((question: any) => (
                            <div
                              key={question.id}
                              className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                              onClick={() =>
                                handleSearchResultClick("question", question)
                              }
                            >
                              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-2">
                                <QuestionMarkCircleIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {question.content?.substring(0, 50)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>

              <DropdownMenu
                open={showNotifications}
                onOpenChange={handleNotificationsOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 10).map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                          />
                        ))}
                        {notifications.length > 10 && (
                          <div className="text-center py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate("/notifications")}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              View all notifications
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 hover:shadow-md transition-all duration-200 group relative"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded="false"
                    aria-controls="radix-:r7:"
                    data-state="closed"
                  >
                    <span className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8 group-hover:ring-2 group-hover:ring-blue-500 group-hover:scale-105 transition-all duration-200">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePicture} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                    <div className="hidden md:block">
                      <span className="group-hover:text-blue-600 transition-colors font-medium">
                        {user?.name}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className="text-xs px-1 py-0 h-4">
                          {user?.role ? user.role.toUpperCase() : "STUDENT"}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1 border-2 border-white animate-pulse"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-80 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl dark:shadow-2xl rounded-2xl overflow-hidden relative before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-blue-500/20 before:via-purple-500/20 before:to-pink-500/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                  align="end"
                  sideOffset={8}
                >
                  <div className="p-6 space-y-4 relative z-10">
                    {/* User Info Header */}
                    <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-200/60 dark:ring-blue-600/40 shadow-lg">
                          <AvatarImage src={user?.profilePicture} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {user?.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                          {/* Online Status */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Online
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items Section */}
                    <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border border-indigo-200/40 dark:border-indigo-700/40 shadow-sm">
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 px-2">
                        Quick Actions
                      </div>
                      <div className="space-y-2">
                        {/* Manage Profile */}
                        <DropdownMenuItem
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md cursor-pointer transition-all duration-200 group border border-transparent hover:border-indigo-200/60 dark:hover:border-indigo-600/40"
                          onClick={() => navigate("/profile")}
                        >
                          <div className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors">
                            Manage profile
                          </span>
                        </DropdownMenuItem>

                        {/* Manage Account */}
                        <DropdownMenuItem
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-200/60 dark:hover:border-purple-600/40"
                          onClick={() => navigate("/settings")}
                        >
                          <div className="w-5 h-5 text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                            <Settings className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors">
                            Manage account
                          </span>
                        </DropdownMenuItem>

                        {canOpenAdminConsole && (
                          <DropdownMenuItem
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md cursor-pointer transition-all duration-200 group border border-transparent hover:border-blue-200/60 dark:hover:border-blue-600/40"
                            onClick={() => navigate("/admin")}
                          >
                            <div className="w-5 h-5 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                              <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors">
                              Open admin console
                            </span>
                          </DropdownMenuItem>
                        )}

                        {/* Sign Out */}
                        <DropdownMenuItem
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md cursor-pointer transition-all duration-200 group border border-transparent hover:border-pink-200/60 dark:hover:border-pink-600/40"
                          onClick={handleLogout}
                        >
                          <div className="w-5 h-5 text-pink-500 dark:text-pink-400 group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-pink-700 dark:group-hover:text-pink-200 transition-colors">
                            Sign out
                          </span>
                        </DropdownMenuItem>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-16 h-full">
          <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar Navigation */}
            <nav className="hidden md:block md:fixed md:left-0 md:top-16 md:h-[calc(100vh-4rem)] md:w-64 border-r bg-card p-4 overflow-y-auto">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => navigateToPage(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </nav>

            {/* Page Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto h-[calc(100vh-4rem)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur">
            <div className="grid grid-cols-5 gap-1 p-2">
              {mobileNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={`mobile-${item.id}`}
                    variant="ghost"
                    onClick={() => navigateToPage(item.id)}
                    className={cn(
                      "h-12 flex flex-col items-center justify-center gap-1",
                      isActive && "text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] leading-none">{item.name}</span>
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
