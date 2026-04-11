const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get("/", authenticateToken, notificationController.listNotifications);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put(
  "/:id/read",
  authenticateToken,
  notificationController.markNotificationAsRead
);

// Compatibility alias used by some frontend paths.
router.post(
  "/:id/read",
  authenticateToken,
  notificationController.markNotificationAsRead
);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
router.put(
  "/mark-all-read",
  authenticateToken,
  notificationController.markAllNotificationsAsRead
);

// Compatibility alias used by social notification context.
router.post(
  "/read-all",
  authenticateToken,
  notificationController.markAllNotificationsAsRead
);

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
router.post("/", authenticateToken, notificationController.createNotification);

module.exports = router;
