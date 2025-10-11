import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Skeleton } from "../../ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  AtSign,
  Trophy,
  CheckCircle,
  X,
  Loader2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
  EyeOff,
  Check,
  XCircle,
  UserX,
  Star,
  MessageSquare,
  ThumbsUp,
  Award,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useToast } from "../../ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

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

const NotificationDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"all" | "unread" | "requests">(
    "all"
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      } else {
        console.error("Failed to fetch notifications:", response.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleFollowRequest = async (
    requesterId: string,
    action: "accept" | "reject"
  ) => {
    setProcessingRequest(requesterId);
    try {
      const endpoint =
        action === "accept"
          ? `http://localhost:5000/api/social/users/${requesterId}/accept-follow-request`
          : `http://localhost:5000/api/social/users/${requesterId}/reject-follow-request`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (action === "accept") {
          success("Request accepted", "You are now following this user.");
        } else {
          success("Request rejected", "Follow request has been rejected.");
        }

        // Remove the notification after action
        setNotifications((prev) =>
          prev.filter(
            (n) => !(n.type === "follow_request" && n.user._id === requesterId)
          )
        );
      } else {
        const errorData = await response.json();
        error(
          "Action failed",
          errorData.message || "Failed to process request."
        );
      }
    } catch (err) {
      console.error("Error processing follow request:", err);
      error("Network error", "Failed to process request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/mark-all-read",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "follow":
        return <UserPlus className={`${iconClass} text-blue-500`} />;
      case "follow_request":
        return <UserPlus className={`${iconClass} text-orange-500`} />;
      case "follow_accepted":
        return <UserCheck className={`${iconClass} text-green-500`} />;
      case "like":
        return <Heart className={`${iconClass} text-red-500`} />;
      case "comment":
        return <MessageCircle className={`${iconClass} text-purple-500`} />;
      case "mention":
        return <AtSign className={`${iconClass} text-indigo-500`} />;
      case "achievement":
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "follow":
        return "border-l-blue-500 bg-blue-50/50";
      case "follow_request":
        return "border-l-orange-500 bg-orange-50/50";
      case "follow_accepted":
        return "border-l-green-500 bg-green-50/50";
      case "like":
        return "border-l-red-500 bg-red-50/50";
      case "comment":
        return "border-l-purple-500 bg-purple-50/50";
      case "mention":
        return "border-l-indigo-500 bg-indigo-50/50";
      case "achievement":
        return "border-l-yellow-500 bg-yellow-50/50";
      default:
        return "border-l-gray-500 bg-gray-50/50";
    }
  };

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

  const getNotificationPriority = (notification: Notification) => {
    if (notification.type === "follow_request") return 3;
    if (!notification.read) return 2;
    return 1;
  };

  const filteredNotifications = notifications
    .filter((notification) => {
      if (viewMode === "unread") return !notification.read;
      if (viewMode === "requests")
        return notification.type === "follow_request";
      return true;
    })
    .sort((a, b) => getNotificationPriority(b) - getNotificationPriority(a));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const requestCount = notifications.filter(
    (n) => n.type === "follow_request"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications ({notifications.length})
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("all")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === "all"
                          ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setViewMode("unread")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === "unread"
                          ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Unread
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </button>
                    <button
                      onClick={() => setViewMode("requests")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === "requests"
                          ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Requests
                      {requestCount > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {requestCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {viewMode === "all"
                      ? "No notifications yet"
                      : viewMode === "unread"
                      ? "No unread notifications"
                      : "No follow requests"}
                  </h3>
                  <p className="text-gray-500">
                    {viewMode === "all"
                      ? "You'll see notifications here when you receive them."
                      : viewMode === "unread"
                      ? "All caught up! No unread notifications."
                      : "No pending follow requests at the moment."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative p-4 border rounded-lg border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-105 ${getNotificationColor(
                          notification.type
                        )} ${!notification.read ? "ring-2 ring-blue-200" : ""}`}
                        onMouseEnter={() =>
                          setHoveredNotification(notification._id)
                        }
                        onMouseLeave={() => setHoveredNotification(null)}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-sm">
                            <AvatarImage
                              src={notification.user?.profilePicture}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {notification.user?.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <span className="font-medium text-gray-900 truncate">
                                {notification.user?.name}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700 line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimeAgo(notification.createdAt)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {new Date(
                                        notification.createdAt
                                      ).toLocaleString()}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Action buttons - only show on hover */}
                              <AnimatePresence>
                                {hoveredNotification === notification._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1"
                                  >
                                    {!notification.read && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                markAsRead(notification._id)
                                              }
                                              className="h-6 w-6 p-0 hover:bg-blue-100"
                                            >
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Mark as read</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    {notification.type === "follow_request" && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  handleFollowRequest(
                                                    notification.user._id,
                                                    "accept"
                                                  )
                                                }
                                                disabled={
                                                  processingRequest ===
                                                  notification.user._id
                                                }
                                                className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600"
                                              >
                                                {processingRequest ===
                                                notification.user._id ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Check className="h-3 w-3" />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Accept request</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                  handleFollowRequest(
                                                    notification.user._id,
                                                    "reject"
                                                  )
                                                }
                                                disabled={
                                                  processingRequest ===
                                                  notification.user._id
                                                }
                                                className="h-6 w-6 p-0 hover:bg-red-100"
                                              >
                                                {processingRequest ===
                                                notification.user._id ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <XCircle className="h-3 w-3" />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Reject request</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 hover:bg-gray-100"
                                        >
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            markAsRead(notification._id)
                                          }
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          Mark as read
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <UserX className="h-4 w-4 mr-2" />
                                          View profile
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationDashboard;
