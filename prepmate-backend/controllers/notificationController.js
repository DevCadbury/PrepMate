const { asyncHandler } = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user.id, req.query);

  res.json({
    success: true,
    notifications: result.notifications,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
    filters: result.filters,
    countsByType: result.countsByType,
    data: {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
      countsByType: result.countsByType,
    },
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user.id, req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    notification,
  });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

const createNotification = asyncHandler(async (req, res) => {
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      success: false,
      message: "type and message are required",
    });
  }

  try {
    const result = await notificationService.createNotifications(req.user.id, req.body);

    if (result.created === 0) {
      return res.json({
        success: true,
        message: "Notification skipped due to user preferences",
        data: {
          notifications: [],
          created: 0,
          targeted: result.targeted,
          skipped: result.skipped,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Created ${result.created} notification(s)`,
      notification: result.notifications[0],
      notifications: result.notifications,
      data: {
        notifications: result.notifications,
        created: result.created,
        targeted: result.targeted,
        skipped: result.skipped,
      },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    throw error;
  }
});

module.exports = {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
};
