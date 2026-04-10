import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "../services/api/notificationsApi";

interface Notification {
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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATION_MIN_FETCH_MS = 30000;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const fetchInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const fetchNotifications = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;

    if (!user) return;

    if (fetchInFlightRef.current) {
      return;
    }

    if (!force && Date.now() - lastFetchAtRef.current < NOTIFICATION_MIN_FETCH_MS) {
      return;
    }

    fetchInFlightRef.current = true;

    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications({ force });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      lastFetchAtRef.current = Date.now();
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      fetchInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Refresh once on mount and then when window/tab becomes active.
  useEffect(() => {
    if (!user) return;

    void fetchNotifications({ force: true });

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
  }, [user, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
