const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);

    const normalizedNotifications = notifications.map((notification) => {
      const obj = notification.toObject();
      return {
        ...obj,
        id: obj._id,
        isRead: !!obj.read,
      };
    });

    const unreadCount = normalizedNotifications.filter(
      (notification) => !notification.isRead
    ).length;

    res.json({
      success: true,
      notifications: normalizedNotifications,
      unreadCount,
      data: {
        notifications: normalizedNotifications,
        unreadCount,
      },
    });
  })
);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put(
  "/:id/read",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

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
  })
);

// Compatibility alias used by some frontend paths.
router.post(
  "/:id/read",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

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
  })
);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
router.put(
  "/mark-all-read",
  authenticateToken,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  })
);

// Compatibility alias used by social notification context.
router.post(
  "/read-all",
  authenticateToken,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  })
);

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type, message, targetUserId, postId } = req.body;

    // Check if user wants to receive this type of notification
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    // Check notification preferences
    const shouldNotify = checkNotificationPreference(targetUser, type);
    if (!shouldNotify) {
      return res.json({
        success: true,
        message: "Notification skipped due to user preferences",
      });
    }

    const notification = new Notification({
      type,
      message,
      userId: targetUserId,
      user: req.user.id,
      postId,
      read: false,
    });

    await notification.save();

    // Populate user info
    await notification.populate("user", "name username profilePicture");

    res.json({
      success: true,
      notification,
    });
  })
);

// Helper function to check notification preferences
function checkNotificationPreference(user, type) {
  const preferences = user.preferences?.notifications;

  switch (type) {
    case "follow":
      return preferences?.newFollowers !== false;
    case "like":
      return preferences?.newLikes !== false;
    case "comment":
      return preferences?.newComments !== false;
    case "mention":
      return preferences?.mentions !== false;
    case "achievement":
      return preferences?.achievements !== false;
    default:
      return true;
  }
}

module.exports = router;
