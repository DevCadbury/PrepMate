const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

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

const sanitizeObjectIdList = (values = []) =>
  values
    .map((value) => value?.toString())
    .filter((value) => mongoose.Types.ObjectId.isValid(value));

const checkNotificationPreference = (user, type) => {
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
};

const buildQuery = (userId, params = {}) => {
  const {
    view = "all",
    type,
    category,
    isRead,
    fromUserId,
    fromDate,
    toDate,
  } = params;

  const query = { userId };

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

  return query;
};

const getNotifications = async (userId, params = {}) => {
  const parsedLimit = Math.max(1, Math.min(parseInt(params.limit, 10) || 50, 100));
  const parsedPage = Math.max(1, parseInt(params.page, 10) || 1);
  const sortOrder = params.sort === "asc" ? 1 : -1;

  const query = buildQuery(userId, params);

  const [notifications, total, unreadCount, countsByType] = await Promise.all([
    Notification.find(query)
      .populate("user", "name username profilePicture")
      .sort({ createdAt: sortOrder })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, read: false }),
    Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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

  return {
    notifications: normalizedNotifications,
    unreadCount,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    },
    filters: {
      view: params.view || "all",
      type: params.type || null,
      category: params.category || null,
    },
    countsByType: typeSummary,
  };
};

const markAsRead = async (userId, notificationId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

const markAllAsRead = async (userId) =>
  Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });

const createNotifications = async (actorUserId, payload) => {
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
  } = payload;

  const normalizedTargetMode = ["single", "followers", "following"].includes(targetMode)
    ? targetMode
    : "single";

  let recipientIds = sanitizeObjectIdList(targetUserIds);
  if (targetUserId) {
    recipientIds.push(targetUserId.toString());
  }

  if (normalizedTargetMode === "followers" || normalizedTargetMode === "following") {
    const actor = await User.findById(actorUserId).select("followers following");
    if (!actor) {
      const error = new Error("Actor user not found");
      error.statusCode = 404;
      throw error;
    }

    const audience =
      normalizedTargetMode === "followers" ? actor.followers || [] : actor.following || [];
    recipientIds.push(...audience.map((id) => id.toString()));
  }

  recipientIds = [...new Set(sanitizeObjectIdList(recipientIds))].filter(
    (recipientId) => recipientId !== actorUserId.toString()
  );

  if (recipientIds.length === 0) {
    const error = new Error("No valid target recipients");
    error.statusCode = 400;
    throw error;
  }

  const targetUsers = await User.find({ _id: { $in: recipientIds } }).select(
    "preferences.notifications"
  );

  if (normalizedTargetMode === "single" && targetUserId && targetUsers.length === 0) {
    const error = new Error("Target user not found");
    error.statusCode = 404;
    throw error;
  }

  const selectedCategory = category || getDefaultCategory(type);

  const notificationsToCreate = targetUsers
    .filter((targetUser) => checkNotificationPreference(targetUser, type))
    .map((targetUser) => ({
      type,
      category: selectedCategory,
      message,
      userId: targetUser._id,
      user: actorUserId,
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
    return {
      notifications: [],
      created: 0,
      targeted: recipientIds.length,
      skipped: recipientIds.length,
    };
  }

  const createdNotifications = await Notification.insertMany(notificationsToCreate);
  const populatedNotifications = await Notification.populate(createdNotifications, {
    path: "user",
    select: "name username profilePicture",
  });

  const normalizedNotifications = populatedNotifications.map(normalizeNotification);

  return {
    notifications: normalizedNotifications,
    created: normalizedNotifications.length,
    targeted: recipientIds.length,
    skipped: recipientIds.length - normalizedNotifications.length,
  };
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotifications,
};
