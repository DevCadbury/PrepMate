import { apiClient } from "../../lib/apiClient";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  userId: string;
  postId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
}

export interface NotificationsPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

const NOTIFICATIONS_CACHE_TTL_MS = 30000;

let notificationsCache: {
  expiresAt: number;
  data: NotificationsPayload;
} | null = null;

const normalizeNotificationsPayload = (payload: any): NotificationsPayload => ({
  notifications: Array.isArray(payload?.notifications)
    ? payload.notifications
    : Array.isArray(payload?.data?.notifications)
      ? payload.data.notifications
      : [],
  unreadCount:
    typeof payload?.unreadCount === "number"
      ? payload.unreadCount
      : typeof payload?.data?.unreadCount === "number"
        ? payload.data.unreadCount
        : 0,
});

export const notificationsApi = {
  clearCache() {
    notificationsCache = null;
  },

  async getNotifications(options?: { force?: boolean }) {
    const force = options?.force === true;
    if (!force && notificationsCache && notificationsCache.expiresAt > Date.now()) {
      return notificationsCache.data;
    }

    const payload = await apiClient.get<any>("/social/notifications");
    const normalized = normalizeNotificationsPayload(payload);

    notificationsCache = {
      expiresAt: Date.now() + NOTIFICATIONS_CACHE_TTL_MS,
      data: normalized,
    };

    return normalized;
  },

  async markAsRead(notificationId: string) {
    await apiClient.post(`/social/notifications/${notificationId}/read`);
    this.clearCache();
  },

  async markAllAsRead() {
    await apiClient.post("/social/notifications/read-all");
    this.clearCache();
  },
};
