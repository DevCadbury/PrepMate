import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  Bell,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Trophy,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { apiClient } from "../../../lib/apiClient";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Skeleton } from "../../ui/skeleton";
import { useToast } from "../../ui/toast";

type NotificationType =
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "like"
  | "comment"
  | "mention"
  | "achievement"
  | "system";

type NotificationView = "all" | "unread" | "requests" | "interactions" | "system";
type ReadFilter = "all" | "read" | "unread";

interface NotificationUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface NotificationItem {
  _id: string;
  id?: string;
  type: NotificationType;
  category?: string;
  message: string;
  userId: string;
  user?: NotificationUser;
  read?: boolean;
  isRead?: boolean;
  priority?: "low" | "normal" | "high";
  targetType?: "user" | "followers" | "following";
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface NotificationResponse {
  notifications?: NotificationItem[];
  unreadCount?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  countsByType?: Record<string, { total: number; unread: number }>;
  data?: {
    notifications?: NotificationItem[];
    unreadCount?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    countsByType?: Record<string, { total: number; unread: number }>;
  };
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const isNotificationRead = (notification: NotificationItem) => {
  if (typeof notification.isRead === "boolean") return notification.isRead;
  return Boolean(notification.read);
};

const notificationIcon = (type: NotificationType) => {
  const iconClass = "h-4.5 w-4.5";
  switch (type) {
    case "follow":
      return <UserPlus className={`${iconClass} text-blue-600`} />;
    case "follow_request":
      return <UserPlus className={`${iconClass} text-amber-600`} />;
    case "follow_accepted":
      return <UserCheck className={`${iconClass} text-emerald-600`} />;
    case "like":
      return <Heart className={`${iconClass} text-rose-600`} />;
    case "comment":
      return <MessageCircle className={`${iconClass} text-violet-600`} />;
    case "mention":
      return <AtSign className={`${iconClass} text-indigo-600`} />;
    case "achievement":
      return <Trophy className={`${iconClass} text-amber-600`} />;
    default:
      return <Bell className={`${iconClass} text-slate-600`} />;
  }
};

const NotificationDashboard: React.FC = () => {
  const { success, error: showError } = useToast();
  const NOTIFICATION_FETCH_MIN_INTERVAL_MS = 2000;

  const showErrorRef = useRef(showError);
  const fetchInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [countsByType, setCountsByType] = useState<Record<string, { total: number; unread: number }>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  const [view, setView] = useState<NotificationView>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingRequestUserId, setProcessingRequestUserId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const buildQueryString = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", "20");
      params.set("view", view);
      params.set("sort", sort);

      if (typeFilter !== "all") params.set("type", typeFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (readFilter === "read") params.set("isRead", "true");
      if (readFilter === "unread") params.set("isRead", "false");

      return params.toString();
    },
    [categoryFilter, readFilter, sort, typeFilter, view]
  );

  const fetchNotifications = useCallback(
    async (options?: {
      nextPage?: number;
      append?: boolean;
      silent?: boolean;
      force?: boolean;
    }) => {
      const nextPage = options?.nextPage || 1;
      const append = options?.append === true;
      const silent = options?.silent === true;
      const force = options?.force === true;

      if (fetchInFlightRef.current) {
        return;
      }

      const shouldRateLimit = !force && !append && nextPage === 1;
      if (
        shouldRateLimit &&
        Date.now() - lastFetchAtRef.current < NOTIFICATION_FETCH_MIN_INTERVAL_MS
      ) {
        return;
      }

      fetchInFlightRef.current = true;

      if (append) {
        setLoadingMore(true);
      } else if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiClient.fetch(
          `/notifications?${buildQueryString(nextPage)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const payload: NotificationResponse = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error((payload as any)?.message || "Failed to fetch notifications");
        }

        const incomingNotifications =
          payload?.data?.notifications || payload?.notifications || [];
        const incomingUnreadCount =
          payload?.data?.unreadCount ?? payload?.unreadCount ?? 0;
        const incomingPagination = payload?.data?.pagination || payload?.pagination;
        const incomingCountsByType =
          payload?.data?.countsByType || payload?.countsByType || {};

        setNotifications((prev) =>
          append ? [...prev, ...incomingNotifications] : incomingNotifications
        );
        setUnreadCount(incomingUnreadCount);
        setCountsByType(incomingCountsByType);
        setPage(incomingPagination?.page || nextPage);
        setTotalPages(incomingPagination?.totalPages || 1);
      } catch (err: any) {
        showErrorRef.current(
          "Unable to load notifications",
          err?.message || "Please try again."
        );
      } finally {
        fetchInFlightRef.current = false;
        if (!append) {
          lastFetchAtRef.current = Date.now();
        }
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [buildQueryString]
  );

  useEffect(() => {
    void fetchNotifications({ nextPage: 1, force: true });
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
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

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to mark notification as read");
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      showError("Update failed", err?.message || "Please try again.");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.fetch("/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to mark all as read");
      }

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true, isRead: true }))
      );
      setUnreadCount(0);
      success("All notifications marked as read");
    } catch (err: any) {
      showError("Update failed", err?.message || "Please try again.");
    }
  };

  const handleFollowRequestAction = async (
    requesterId: string,
    action: "accept" | "reject",
    notificationId: string
  ) => {
    setProcessingRequestUserId(requesterId);
    try {
      const endpoint =
        action === "accept"
          ? `/users/accept-follow-request/${requesterId}`
          : `/users/reject-follow-request/${requesterId}`;

      const response = await apiClient.fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || `Failed to ${action} request`);
      }

      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      success(
        action === "accept"
          ? "Follow request accepted"
          : "Follow request rejected"
      );

      void fetchNotifications({ nextPage: 1, silent: true, force: true });
    } catch (err: any) {
      showError("Action failed", err?.message || "Please try again.");
    } finally {
      setProcessingRequestUserId(null);
    }
  };

  const hasMore = page < totalPages;

  const summaryTypeBadges = useMemo(() => {
    return Object.entries(countsByType)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);
  }, [countsByType]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by audience, type, and read status to triage updates quickly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-2.5 py-1">
            {unreadCount} unread
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void fetchNotifications({ nextPage: 1, silent: true, force: true })
            }
            disabled={refreshing}
          >
            <RefreshCcw className="mr-1.5 h-4 w-4" />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
          <Button size="sm" variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              value={view}
              onValueChange={(value) => setView(value as NotificationView)}
            >
              <SelectTrigger>
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="requests">Follow Requests</SelectItem>
                <SelectItem value="interactions">Interactions</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="follow_request">Follow Request</SelectItem>
                <SelectItem value="follow_accepted">Follow Accepted</SelectItem>
                <SelectItem value="follow">Follow</SelectItem>
                <SelectItem value="like">Like</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="mention">Mention</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="request">Request</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={readFilter}
              onValueChange={(value) => setReadFilter(value as ReadFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Read state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => setSort(value as "desc" | "asc")}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest first</SelectItem>
                <SelectItem value="asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summaryTypeBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summaryTypeBadges.map(([type, stats]) => (
                <Badge key={type} variant="outline" className="capitalize">
                  {type.replace("_", " ")}: {stats.total}
                  {stats.unread > 0 ? ` (${stats.unread} unread)` : ""}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`notification-skeleton-${index}`} className="rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No notifications match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const read = isNotificationRead(notification);
                const actor = notification.user;

                return (
                  <div
                    key={notification._id}
                    className={`rounded-xl border p-4 transition-colors ${
                      read ? "bg-card" : "bg-blue-50/60 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={actor?.profilePicture} />
                          <AvatarFallback>
                            {actor?.name?.charAt(0)?.toUpperCase() || "N"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {notificationIcon(notification.type)}
                            <p className="truncate text-sm font-semibold text-foreground">
                              {actor?.name || "System"}
                            </p>
                            <Badge variant="outline" className="text-[11px] capitalize">
                              {notification.type.replace("_", " ")}
                            </Badge>
                            {notification.category && (
                              <Badge variant="secondary" className="text-[11px] capitalize">
                                {notification.category}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-foreground/90">{notification.message}</p>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.targetType && (
                              <span className="rounded-full border px-2 py-0.5 capitalize">
                                Target: {notification.targetType}
                              </span>
                            )}
                            {notification.priority && (
                              <span className="rounded-full border px-2 py-0.5 capitalize">
                                Priority: {notification.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void markAsRead(notification._id)}
                          >
                            Mark read
                          </Button>
                        )}

                        {notification.type === "follow_request" && actor?._id && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={processingRequestUserId === actor._id}
                              onClick={() =>
                                void handleFollowRequestAction(
                                  actor._id,
                                  "accept",
                                  notification._id
                                )
                              }
                            >
                              {processingRequestUserId === actor._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1.5 h-4 w-4" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={processingRequestUserId === actor._id}
                              onClick={() =>
                                void handleFollowRequestAction(
                                  actor._id,
                                  "reject",
                                  notification._id
                                )
                              }
                            >
                              <X className="mr-1.5 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      void fetchNotifications({ nextPage: page + 1, append: true })
                    }
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDashboard;
