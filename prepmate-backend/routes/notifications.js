const express = require("express");
const mongoose = require("mongoose");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const normalizeNotification = (notification) => {
  const obj = notification.toObject ? notification.toObject() : notification;
  return {
    ...obj,
    id: obj._id,
    isRead: !!obj.read,
  };
};

const getDefaultCategory = (type) => {
  if (type === "system") return "system";
  if (type === "follow_request") return "request";
  return "social";
};

const sanitizeObjectIdList = (values = []) => {
  return values
    .map((value) => value?.toString())
    .filter((value) => mongoose.Types.ObjectId.isValid(value));
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      view = "all",
      type,
      category,
      isRead,
      fromUserId,
      fromDate,
      toDate,
      limit = "50",
      page = "1",
      sort = "desc",
    } = req.query;

    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const query = { userId: req.user.id };

    if (view === "unread") {
      query.read = false;
    } else if (view === "requests") {
      query.type = "follow_request";
    } else if (view === "interactions") {
      query.type = {
        $in: ["follow", "follow_accepted", "like", "comment", "mention"],
      };
    } else if (view === "system") {
      query.category = "system";
    }

    if (typeof isRead === "string") {
      query.read = isRead === "true";
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (fromUserId && mongoose.Types.ObjectId.isValid(fromUserId)) {
      query.user = fromUserId;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (!Number.isNaN(parsedFromDate.getTime())) {
          query.createdAt.$gte = parsedFromDate;
        }
      }
      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (!Number.isNaN(parsedToDate.getTime())) {
          query.createdAt.$lte = parsedToDate;
        }
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    const sortOrder = sort === "asc" ? 1 : -1;

    const [notifications, total, unreadCount, countsByType] = await Promise.all([
      Notification.find(query)
        .populate("user", "name username profilePicture")
        .sort({ createdAt: sortOrder })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user.id, read: false }),
      Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: "$type",
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$read", false] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const normalizedNotifications = notifications.map(normalizeNotification);
    const typeSummary = countsByType.reduce((acc, row) => {
      acc[row._id] = {
        total: row.total,
        unread: row.unread,
      };
      return acc;
    }, {});

    res.json({
      success: true,
      notifications: normalizedNotifications,
      unreadCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
      },
      filters: {
        view,
        type: type || null,
        category: category || null,
      },
      countsByType: typeSummary,
      data: {
        notifications: normalizedNotifications,
        unreadCount,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
        },
        countsByType: typeSummary,
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
      { read: true, readAt: new Date() },
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
      { read: true, readAt: new Date() },
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
      { read: true, readAt: new Date() }
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
      { read: true, readAt: new Date() }
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
    const {
      type,
      message,
      targetUserId,
      targetUserIds = [],
      targetMode = "single",
      postId,
      metadata = {},
      category,
      priority = "normal",
    } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: "type and message are required",
      });
    }

    const normalizedTargetMode = ["single", "followers", "following"].includes(
      targetMode
    )
      ? targetMode
      : "single";

    let recipientIds = sanitizeObjectIdList(targetUserIds);
    if (targetUserId) {
      recipientIds.push(targetUserId.toString());
    }

    if (normalizedTargetMode === "followers" || normalizedTargetMode === "following") {
      const actor = await User.findById(req.user.id).select("followers following");
      if (!actor) {
        return res.status(404).json({
          success: false,
          message: "Actor user not found",
        });
      }

      const audience =
        normalizedTargetMode === "followers" ? actor.followers || [] : actor.following || [];
      recipientIds.push(...audience.map((id) => id.toString()));
    }

    recipientIds = [...new Set(sanitizeObjectIdList(recipientIds))].filter(
      (recipientId) => recipientId !== req.user.id.toString()
    );

    if (recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid target recipients",
      });
    }

    const targetUsers = await User.find({
      _id: { $in: recipientIds },
    }).select("preferences.notifications");

    if (normalizedTargetMode === "single" && targetUserId && targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const selectedCategory = category || getDefaultCategory(type);

    const notificationsToCreate = targetUsers
      .filter((targetUser) => checkNotificationPreference(targetUser, type))
      .map((targetUser) => ({
        type,
        category: selectedCategory,
        message,
        userId: targetUser._id,
        user: req.user.id,
        targetType:
          normalizedTargetMode === "followers"
            ? "followers"
            : normalizedTargetMode === "following"
              ? "following"
              : "user",
        targetId: normalizedTargetMode === "single" ? targetUser._id : undefined,
        postId,
        metadata,
        priority,
        read: false,
      }));

    if (notificationsToCreate.length === 0) {
      return res.json({
        success: true,
        message: "Notification skipped due to user preferences",
        data: {
          notifications: [],
          created: 0,
          targeted: recipientIds.length,
          skipped: recipientIds.length,
        },
      });
    }

    const createdNotifications = await Notification.insertMany(notificationsToCreate);
    const populatedNotifications = await Notification.populate(createdNotifications, {
      path: "user",
      select: "name username profilePicture",
    });

    const normalizedNotifications = populatedNotifications.map(normalizeNotification);

    res.status(201).json({
      success: true,
      message: `Created ${normalizedNotifications.length} notification(s)`,
      notification: normalizedNotifications[0],
      notifications: normalizedNotifications,
      data: {
        notifications: normalizedNotifications,
        created: normalizedNotifications.length,
        targeted: recipientIds.length,
        skipped: recipientIds.length - normalizedNotifications.length,
      },
    });
  })
);

// Helper function to check notification preferences
function checkNotificationPreference(user, type) {
  const preferences = user.preferences?.notifications;

  switch (type) {
    case "follow":
    case "follow_request":
    case "follow_accepted":
      return preferences?.newFollowers !== false;
    case "like":
      return preferences?.newLikes !== false;
    case "comment":
      return preferences?.newComments !== false;
    case "mention":
      return preferences?.mentions !== false;
    case "achievement":
      return preferences?.achievements !== false;
    case "system":
      return true;
    default:
      return true;
  }
}

module.exports = router;
