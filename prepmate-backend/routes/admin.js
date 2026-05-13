const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { getFrontendBaseUrl } = require("../utils/urlConfig");

const User = require("../models/User");
const Post = require("../models/Post");
const Message = require("../models/Message");
const CodingProblem = require("../models/CodingProblem");
const CodingSubmission = require("../models/CodingSubmission");
const SupportTicket = require("../models/SupportTicket");
const Notification = require("../models/Notification");
const Comment = require("../models/Comment");
const Interview = require("../models/Interview");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const {
  authenticateToken,
  authorizeRoles,
  authorizeAdminPermissions,
  getEffectiveAdminPermissions,
  normalizeAdminPermissionKey,
  normalizeAdminRole,
  ADMIN_PERMISSION_CATALOG,
  ADMIN_ROLE_PERMISSION_DEFAULTS,
} = require("../middleware/auth");

const router = express.Router();

const USER_ROLES = ["student", "teacher", "hr", "admin", "support"];
const POST_STATUSES = ["active", "archived", "deleted", "hidden"];
const CHAT_REVIEW_ACTIONS = new Set(["resolved", "dismissed", "blocked"]);
const ADMIN_SUB_ROLES = [
  "superadmin",
  "moderator",
  "support_admin",
  "analytics_admin",
];
const ADMIN_INVITE_TOKEN_PREFIX = "admin_";
const ADMIN_INVITE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const adminInviteTokens = new Map();

const ADMIN_PERMISSION_KEYS = Object.freeze({
  DASHBOARD_VIEW: "admin.dashboard.view",
  USERS_VIEW: "admin.users.view",
  USERS_MODERATE: "admin.users.moderate",
  USERS_DELETE: "admin.users.delete",
  USERS_ROLE_ASSIGN: "admin.users.role.assign",
  USERS_PERMISSIONS_MANAGE: "admin.users.permissions.manage",
  USERS_PASSWORD_RESET: "admin.users.password.reset",
  CONTENT_VIEW: "admin.content.view",
  CONTENT_MODERATE: "admin.content.moderate",
  CHAT_REPORTS_VIEW: "admin.chatreports.view",
  CHAT_REPORTS_MODERATE: "admin.chatreports.moderate",
  ANALYTICS_VIEW: "admin.analytics.view",
  ANALYTICS_VIEW_LIMITED: "admin.analytics.view.limited",
  AI_VIEW: "admin.ai.view",
  CODING_VIEW: "admin.coding.view",
  CODING_MODERATE: "admin.coding.moderate",
  CODING_DELETE: "admin.coding.delete",
  HELP_VIEW: "admin.help.view",
  HELP_MANAGE: "admin.help.manage",
  SETTINGS_VIEW: "admin.settings.view",
  SETTINGS_MANAGE: "admin.settings.manage",
  LOGS_VIEW: "admin.logs.view",
  TOKENS_GENERATE: "admin.tokens.generate",
  ADMINS_MANAGE: "admin.admins.manage",
  ADMINS_CREATE: "admin.admins.create",
});

const ADMIN_PERMISSION_KEY_SET = new Set(
  ADMIN_PERMISSION_CATALOG.map((permission) => permission.key)
);
const LEGACY_PERMISSION_KEY_SET = new Set([
  "user_management",
  "analytics_view",
  "admin_creation",
]);

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateCouponCode = (prefix = "") => {
  const safePrefix = String(prefix || "").toUpperCase();
  return `${safePrefix}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

const normalizePostModerationStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "approved") {
    return "active";
  }

  if (normalized === "rejected" || normalized === "removed") {
    return "hidden";
  }

  return normalized;
};

const parseRequestedAdminRole = (value, fallback = "support_admin") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (ADMIN_SUB_ROLES.includes(normalized)) {
    return normalized;
  }

  return null;
};

const sanitizePermissionList = (permissions) => {
  const rawPermissions = Array.isArray(permissions) ? permissions : [];
  const normalizedPermissions = rawPermissions
    .map((permission) => normalizeAdminPermissionKey(permission))
    .filter(
      (permission) =>
        permission === "*" ||
        permission.endsWith(".*") ||
        LEGACY_PERMISSION_KEY_SET.has(permission) ||
        ADMIN_PERMISSION_KEY_SET.has(permission)
    )
    .filter(Boolean);

  return Array.from(new Set(normalizedPermissions));
};

const pruneExpiredAdminInviteTokens = () => {
  const now = Date.now();

  for (const [token, record] of adminInviteTokens.entries()) {
    if (!record?.expiresAt || new Date(record.expiresAt).getTime() <= now) {
      adminInviteTokens.delete(token);
    }
  }
};

const issueAdminInviteToken = (createdBy, metadata = {}) => {
  pruneExpiredAdminInviteTokens();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = `${ADMIN_INVITE_TOKEN_PREFIX}${rawToken}`;
  const expiresAt = new Date(Date.now() + ADMIN_INVITE_TOKEN_TTL_MS);

  adminInviteTokens.set(token, {
    createdBy,
    expiresAt,
    metadata,
    used: false,
  });

  return { token, expiresAt };
};

const consumeAdminInviteToken = (token) => {
  pruneExpiredAdminInviteTokens();

  const record = adminInviteTokens.get(token);
  if (!record) {
    return {
      success: false,
      message: "Invalid or expired admin token",
    };
  }

  if (record.used) {
    return {
      success: false,
      message: "Admin token has already been used",
    };
  }

  const expiresAtMs = new Date(record.expiresAt).getTime();
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    adminInviteTokens.delete(token);
    return {
      success: false,
      message: "Admin token has expired",
    };
  }

  record.used = true;
  adminInviteTokens.set(token, record);

  return {
    success: true,
    record,
  };
};

const mapUserStatus = (user) => {
  if (user.isActive) return "active";
  if (user.emailVerified) return "suspended";
  return "pending";
};

const mapUserRecord = (user) => ({
  id: String(user._id),
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  adminRole: user.adminRole || null,
  status: mapUserStatus(user),
  joinDate: user.createdAt,
  lastLogin: user.lastLogin || user.createdAt,
  subscription: user.subscription || "free",
  permissions: user.permissions || [],
  restrictions: user.restrictions || undefined,
  googleLinked: Boolean(user.googleId),
  profilePicture: user.profilePicture || "",
});

const truncate = (value, size = 180) => {
  const text = String(value || "").trim();
  if (text.length <= size) {
    return text;
  }

  return `${text.slice(0, size)}...`;
};

const resolveChatReportState = (message) => {
  const logs = Array.isArray(message.adminLogs) ? message.adminLogs : [];
  const reportLogs = logs.filter((log) => log.action === "reported");

  if (reportLogs.length === 0) {
    return null;
  }

  const sortedReports = reportLogs
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const lastReport = sortedReports[sortedReports.length - 1];
  const lastReportTime = new Date(lastReport.timestamp).getTime();

  const reviewLogs = logs
    .filter(
      (log) =>
        CHAT_REVIEW_ACTIONS.has(log.action) &&
        new Date(log.timestamp).getTime() >= lastReportTime
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const latestReview = reviewLogs.length > 0 ? reviewLogs[reviewLogs.length - 1] : null;
  const status = latestReview ? latestReview.action : "open";

  return {
    messageId: String(message._id),
    roomId: message.chatRoomId
      ? String(message.chatRoomId._id || message.chatRoomId)
      : null,
    messagePreview: truncate(message.message, 220),
    sender: message.senderId
      ? {
          id: String(message.senderId._id || message.senderId),
          name: message.senderId.name,
          username: message.senderId.username,
          profilePicture: message.senderId.profilePicture,
        }
      : null,
    receiver: message.receiverId
      ? {
          id: String(message.receiverId._id || message.receiverId),
          name: message.receiverId.name,
          username: message.receiverId.username,
          profilePicture: message.receiverId.profilePicture,
        }
      : null,
    reportCount: reportLogs.length,
    lastReason: lastReport.reason || "",
    lastReportedAt: lastReport.timestamp,
    status,
    reviewedAt: latestReview?.timestamp,
    reviewedBy: latestReview?.adminId ? String(latestReview.adminId) : null,
  };
};

router.get(
  "/me",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select(
          "name username email role adminRole isActive createdAt lastLogin subscription permissions googleId profilePicture emailVerified restrictions"
        )
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Admin user not found",
        });
      }

      const normalizedAdminRole = normalizeAdminRole(
        user.adminRole || "superadmin"
      );
      const customPermissions = sanitizePermissionList(user.permissions);
      const effectivePermissions = getEffectiveAdminPermissions({
        ...user,
        role: "admin",
        adminRole: normalizedAdminRole,
      });

      res.json({
        success: true,
        data: {
          user: mapUserRecord(user),
          adminRole: normalizedAdminRole,
          customPermissions,
          effectivePermissions,
          permissionCatalog: ADMIN_PERMISSION_CATALOG,
          roleDefaults: ADMIN_ROLE_PERMISSION_DEFAULTS,
        },
      });
    } catch (error) {
      console.error("Admin me endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/permissions/catalog",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_VIEW]),
  async (req, res) => {
    try {
      const catalogByModule = ADMIN_PERMISSION_CATALOG.reduce((acc, entry) => {
        if (!acc[entry.module]) {
          acc[entry.module] = [];
        }

        acc[entry.module].push(entry);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          permissions: ADMIN_PERMISSION_CATALOG,
          grouped: catalogByModule,
          roleDefaults: ADMIN_ROLE_PERMISSION_DEFAULTS,
        },
      });
    } catch (error) {
      console.error("Admin permission catalog error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW]),
  async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        users,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false, emailVerified: false }),
        User.countDocuments({ isActive: false, emailVerified: true }),
        User.find()
          .select(
            "name username email role isActive createdAt lastLogin subscription permissions googleId profilePicture emailVerified"
          )
          .sort({ createdAt: -1 }),
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        totalRevenue: 150000,
        monthlyGrowth: 12.5,
        pendingUsers,
        suspendedUsers,
      };

      res.json({
        success: true,
        stats,
        users: users.map(mapUserRecord),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/overview",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW]),
  async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        adminUsers,
        supportUsers,
        totalPosts,
        hiddenPosts,
        reportedPosts,
        totalTickets,
        openTickets,
        pendingCodingSubmissions,
        allReportedMessages,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "support" }),
        Post.countDocuments(),
        Post.countDocuments({ status: "hidden" }),
        Post.countDocuments({ "reports.status": "pending" }),
        SupportTicket.countDocuments(),
        SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
        CodingProblem.countDocuments({
          approvalStatus: "pending",
          createdBy: { $exists: true, $ne: null },
        }),
        Message.find({ "adminLogs.action": "reported" }).select("adminLogs"),
      ]);

      const openChatReports = allReportedMessages.reduce((count, message) => {
        const state = resolveChatReportState(message);
        return state?.status === "open" ? count + 1 : count;
      }, 0);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            admins: adminUsers,
            support: supportUsers,
          },
          social: {
            totalPosts,
            hiddenPosts,
            reportedPosts,
            openChatReports,
          },
          support: {
            totalTickets,
            openTickets,
          },
          coding: {
            pendingSubmissions: pendingCodingSubmissions,
          },
        },
      });
    } catch (error) {
      console.error("Admin overview error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/insights",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW]),
  async (req, res) => {
    try {
      const now = Date.now();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const [followAggregate = {}, totalNotifications, unreadNotifications, systemNotifications, notificationsLast24h, aiConfiguredUsers, aiValidUsers, subscriptionAggregation, pendingPostReports, reportedMessages, postModerationActions, chatModerationActions] =
        await Promise.all([
          User.aggregate([
            {
              $project: {
                incomingRequestsCount: {
                  $size: { $ifNull: ["$followRequests", []] },
                },
                outgoingRequestsCount: {
                  $size: { $ifNull: ["$pendingFollowRequests", []] },
                },
                actionsLast7dCount: {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$followRequestActions", []] },
                      as: "action",
                      cond: {
                        $gte: ["$$action.createdAt", sevenDaysAgo],
                      },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                pendingIncomingRequests: { $sum: "$incomingRequestsCount" },
                pendingOutgoingRequests: { $sum: "$outgoingRequestsCount" },
                usersWithIncomingRequests: {
                  $sum: {
                    $cond: [{ $gt: ["$incomingRequestsCount", 0] }, 1, 0],
                  },
                },
                usersWithOutgoingRequests: {
                  $sum: {
                    $cond: [{ $gt: ["$outgoingRequestsCount", 0] }, 1, 0],
                  },
                },
                actionsLast7d: { $sum: "$actionsLast7dCount" },
              },
            },
          ]).then((rows) => rows[0] || {}),
          Notification.countDocuments(),
          Notification.countDocuments({ read: false }),
          Notification.countDocuments({ category: "system" }),
          Notification.countDocuments({ createdAt: { $gte: oneDayAgo } }),
          User.countDocuments({
            "aiCompanion.geminiApiKey": { $exists: true, $ne: "" },
          }),
          User.countDocuments({ "aiCompanion.isApiKeyValid": true }),
          User.aggregate([
            {
              $group: {
                _id: { $ifNull: ["$subscription", "free"] },
                count: { $sum: 1 },
              },
            },
          ]),
          Post.countDocuments({ "reports.status": "pending" }),
          Message.find({ "adminLogs.action": "reported" }).select("adminLogs"),
          Post.aggregate([
            {
              $unwind: {
                path: "$reports",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                "reports.reviewedAt": { $gte: oneDayAgo },
              },
            },
            {
              $count: "count",
            },
          ]),
          Message.aggregate([
            {
              $unwind: {
                path: "$adminLogs",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                "adminLogs.action": {
                  $in: ["resolved", "dismissed", "blocked"],
                },
                "adminLogs.timestamp": { $gte: oneDayAgo },
              },
            },
            {
              $count: "count",
            },
          ]),
        ]);

      const subscriptionCounts = {
        free: 0,
        basic: 0,
        premium: 0,
        enterprise: 0,
      };

      subscriptionAggregation.forEach((entry) => {
        const key = String(entry._id || "free").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(subscriptionCounts, key)) {
          subscriptionCounts[key] = entry.count;
        }
      });

      const openChatReports = reportedMessages.reduce((count, message) => {
        const state = resolveChatReportState(message);
        return state?.status === "open" ? count + 1 : count;
      }, 0);

      const postModerationActions24h = postModerationActions?.[0]?.count || 0;
      const chatModerationActions24h = chatModerationActions?.[0]?.count || 0;

      res.json({
        success: true,
        data: {
          follow: {
            pendingIncomingRequests: followAggregate.pendingIncomingRequests || 0,
            pendingOutgoingRequests: followAggregate.pendingOutgoingRequests || 0,
            usersWithIncomingRequests: followAggregate.usersWithIncomingRequests || 0,
            usersWithOutgoingRequests: followAggregate.usersWithOutgoingRequests || 0,
            actionsLast7d: followAggregate.actionsLast7d || 0,
          },
          notifications: {
            total: totalNotifications,
            unread: unreadNotifications,
            system: systemNotifications,
            createdLast24h: notificationsLast24h,
          },
          ai: {
            configuredUsers: aiConfiguredUsers,
            validUsers: aiValidUsers,
          },
          subscriptions: subscriptionCounts,
          audit: {
            pendingPostReports,
            openChatReports,
            postModerationActions24h,
            chatModerationActions24h,
            moderationActions24h:
              postModerationActions24h + chatModerationActions24h,
          },
        },
      });
    } catch (error) {
      console.error("Admin insights error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/users",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_VIEW]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const search = String(req.query.search || "").trim();
      const role = String(req.query.role || "").trim().toLowerCase();
      const status = String(req.query.status || "").trim().toLowerCase();

      const where = {};

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        where.$or = [{ name: regex }, { email: regex }, { username: regex }];
      }

      if (USER_ROLES.includes(role)) {
        where.role = role;
      }

      if (status === "active") {
        where.isActive = true;
      } else if (status === "suspended") {
        where.isActive = false;
        where.emailVerified = true;
      } else if (status === "pending") {
        where.isActive = false;
        where.emailVerified = false;
      }

      const [total, users] = await Promise.all([
        User.countDocuments(where),
        User.find(where)
          .select(
            "name username email role isActive createdAt lastLogin subscription permissions googleId profilePicture emailVerified"
          )
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
      ]);

      res.json({
        success: true,
        data: {
          users: users.map(mapUserRecord),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Admin users list error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.patch(
  "/users/:userId/status",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_MODERATE]),
  async (req, res) => {
    try {
      const nextStatus = String(req.body.status || "").trim().toLowerCase();

      if (!["active", "suspended"].includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Status must be active or suspended",
        });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.isActive = nextStatus === "active";
      await user.save();

      res.json({
        success: true,
        message: "User status updated successfully",
        data: {
          user: mapUserRecord(user),
        },
      });
    } catch (error) {
      console.error("Admin user status update error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.post(
  "/users/:userId/suspend",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_MODERATE]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive: false },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User suspended successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.post(
  "/users/:userId/activate",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_MODERATE]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive: true },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User activated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.post(
  "/users/:userId/delete",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_DELETE]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.put(
  "/users/:userId/role",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_ROLE_ASSIGN]),
  async (req, res) => {
    try {
      const { role } = req.body;
      const normalizedRole = String(role || "").trim().toLowerCase();

      if (!USER_ROLES.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role: normalizedRole },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User role updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.put(
  "/users/:userId/permissions",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_PERMISSIONS_MANAGE]),
  async (req, res) => {
    try {
      const { permissions } = req.body;
      const normalizedPermissions = sanitizePermissionList(permissions);
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { permissions: normalizedPermissions },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        message: "User permissions updated successfully",
        data: {
          user: mapUserRecord(user),
          customPermissions: normalizedPermissions,
          effectiveAdminPermissions:
            user.role === "admin" ? getEffectiveAdminPermissions(user) : [],
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/users/:userId/custom-permissions",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_PERMISSIONS_MANAGE]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select(
        "name email role adminRole permissions"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const customPermissions = sanitizePermissionList(user.permissions);
      const effectiveAdminPermissions =
        user.role === "admin"
          ? getEffectiveAdminPermissions(user)
          : [];

      res.json({
        success: true,
        data: {
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            adminRole: user.adminRole || null,
          },
          customPermissions,
          effectiveAdminPermissions,
        },
      });
    } catch (error) {
      console.error("Admin custom permission read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.patch(
  "/users/:userId/custom-permissions",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_PERMISSIONS_MANAGE]),
  async (req, res) => {
    try {
      const customPermissions = sanitizePermissionList(req.body.permissions);

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.permissions = customPermissions;
      await user.save();

      const effectiveAdminPermissions =
        user.role === "admin"
          ? getEffectiveAdminPermissions(user)
          : [];

      res.json({
        success: true,
        message: "Custom permissions updated",
        data: {
          user: mapUserRecord(user),
          customPermissions,
          effectiveAdminPermissions,
        },
      });
    } catch (error) {
      console.error("Admin custom permission update error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/social/posts",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CONTENT_VIEW]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const reportedOnly = String(req.query.reportedOnly || "false") === "true";
      const status = String(req.query.status || "").trim().toLowerCase();
      const search = String(req.query.search || "").trim();

      const where = {};

      if (POST_STATUSES.includes(status)) {
        where.status = status;
      }

      if (reportedOnly) {
        where["reports.status"] = "pending";
      }

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        where.$or = [{ content: regex }, { tags: { $in: [regex] } }];
      }

      const [total, posts] = await Promise.all([
        Post.countDocuments(where),
        Post.find(where)
          .select("content type status reports tags createdAt user")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("user", "name username profilePicture")
          .lean(),
      ]);

      const items = posts.map((post) => {
        const reports = Array.isArray(post.reports) ? post.reports : [];
        const pendingReports = reports.filter((report) => report.status === "pending");

        return {
          id: String(post._id),
          type: post.type,
          status: post.status,
          contentPreview: truncate(post.content, 220),
          tags: Array.isArray(post.tags) ? post.tags : [],
          reportsCount: reports.length,
          pendingReportsCount: pendingReports.length,
          latestReportReason:
            pendingReports.length > 0
              ? pendingReports[pendingReports.length - 1].reason || ""
              : "",
          createdAt: post.createdAt,
          user: post.user
            ? {
                id: String(post.user._id || post.user),
                name: post.user.name,
                username: post.user.username,
                profilePicture: post.user.profilePicture,
              }
            : null,
        };
      });

      res.json({
        success: true,
        data: {
          posts: items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Admin social posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.patch(
  "/social/posts/:postId/moderate",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CONTENT_MODERATE]),
  async (req, res) => {
    try {
      const nextStatus = normalizePostModerationStatus(req.body.status);
      const resolutionNote = String(req.body.resolutionNote || "").trim();

      if (!POST_STATUSES.includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid moderation status",
        });
      }

      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      post.status = nextStatus;

      if (Array.isArray(post.reports) && post.reports.length > 0) {
        post.reports.forEach((report) => {
          if (report.status !== "pending") {
            return;
          }

          report.status = nextStatus === "active" ? "dismissed" : "reviewed";
          report.reviewedBy = req.user._id;
          report.reviewedAt = new Date();
          report.resolutionNote = resolutionNote || report.resolutionNote || "";
        });
      }

  post.markModified("reports");

      await post.save();

      res.json({
        success: true,
        message: "Post moderation status updated",
      });
    } catch (error) {
      console.error("Admin post moderation error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/chat/reports",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CHAT_REPORTS_VIEW]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const status = String(req.query.status || "").trim().toLowerCase();

      const messages = await Message.find({ "adminLogs.action": "reported" })
        .select("message senderId receiverId chatRoomId adminLogs createdAt")
        .sort({ createdAt: -1 })
        .populate("senderId", "name username profilePicture")
        .populate("receiverId", "name username profilePicture")
        .lean();

      const reports = messages
        .map(resolveChatReportState)
        .filter(Boolean)
        .filter((item) => (status && status !== "all" ? item.status === status : true))
        .sort((a, b) => new Date(b.lastReportedAt) - new Date(a.lastReportedAt));

      const start = (page - 1) * limit;
      const paged = reports.slice(start, start + limit);

      res.json({
        success: true,
        data: {
          reports: paged,
          pagination: {
            page,
            limit,
            total: reports.length,
            totalPages: Math.ceil(reports.length / limit),
          },
        },
      });
    } catch (error) {
      console.error("Admin chat reports error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.patch(
  "/chat/reports/:messageId",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CHAT_REPORTS_MODERATE]),
  async (req, res) => {
    try {
      const decision = String(req.body.decision || "").trim().toLowerCase();
      const note = String(req.body.note || "").trim();

      if (!CHAT_REVIEW_ACTIONS.has(decision)) {
        return res.status(400).json({
          success: false,
          message: "Decision must be resolved, dismissed, or blocked",
        });
      }

      const message = await Message.findById(req.params.messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      message.adminLogs.push({
        action: decision,
        adminId: req.user._id,
        actorId: req.user._id,
        reason: note || `Report ${decision}`,
        details: note,
        timestamp: new Date(),
      });

      if (decision === "blocked") {
        message.isDeleted = true;
        message.message = "Message removed by admin moderation";
      }

      await message.save();

      res.json({
        success: true,
        message: "Chat report reviewed successfully",
      });
    } catch (error) {
      console.error("Admin chat report review error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/logs/recent",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.LOGS_VIEW]),
  async (req, res) => {
    try {
      const lines = Math.min(1000, Math.max(20, Number(req.query.lines || 200)));
      const filePath = path.resolve(__dirname, "../logs/app.log");

      let content = "";
      try {
        content = await fs.readFile(filePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") {
          return res.json({
            success: true,
            data: {
              lines: [],
            },
          });
        }
        throw error;
      }

      const allLines = content
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);

      res.json({
        success: true,
        data: {
          lines: allLines.slice(-lines),
        },
      });
    } catch (error) {
      console.error("Admin log read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.post(
  "/generate-token",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.TOKENS_GENERATE]),
  async (req, res) => {
    try {
      const requestedAdminRole = parseRequestedAdminRole(
        req.body.adminRole,
        "support_admin"
      );
      if (!requestedAdminRole) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin role requested for invite token",
        });
      }

      const requestedPermissions = sanitizePermissionList(req.body.permissions);

      const { token, expiresAt } = issueAdminInviteToken(req.user._id, {
        adminRole: requestedAdminRole,
        permissions: requestedPermissions,
      });

      res.json({
        success: true,
        token,
        expiresAt,
        message: "Admin token generated successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.post("/create-admin", async (req, res) => {
  try {
    const { token, name, email, password, username, adminRole, permissions } =
      req.body;

    if (!String(name || "").trim() || !String(email || "").trim() || !String(password || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!String(token || "").startsWith(ADMIN_INVITE_TOKEN_PREFIX)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid admin token" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const consumedToken = consumeAdminInviteToken(String(token));
    if (!consumedToken.success) {
      return res.status(400).json({
        success: false,
        message: consumedToken.message,
      });
    }

    const tokenMeta = consumedToken.record?.metadata || {};

    const normalizedAdminRole = parseRequestedAdminRole(
      adminRole || tokenMeta.adminRole,
      "support_admin"
    );
    if (!normalizedAdminRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin role",
      });
    }

    const normalizedPermissions = sanitizePermissionList(
      permissions || tokenMeta.permissions || []
    );

    const adminUser = new User({
      name,
      email,
      password,
      username: username || email.split("@")[0],
      role: "admin",
      adminRole: normalizedAdminRole,
      isActive: true,
      emailVerified: true,
      permissions: normalizedPermissions,
    });

    await adminUser.save();

    res.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        adminRole: adminUser.adminRole,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ─── USER PROFILE ADMIN CARD ─────────────────────────────────────────────────
router.get(
  "/users/:userId/profile",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_VIEW]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select("-password -aiCompanion.geminiApiKey")
        .populate("followers", "name username profilePicture")
        .populate("following", "name username profilePicture")
        .lean();

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const [posts, loginLogs, codingSubmissions, interviewCount] = await Promise.all([
        Post.find({ user: user._id })
          .select("content type status createdAt likes comments reports")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        [], // Login logs would come from a separate logging system
        CodingSubmission ? CodingSubmission.find({ user: user._id })
          .select("problem language status score submittedAt")
          .sort({ submittedAt: -1 })
          .limit(20)
          .lean()
          .catch(() => []) : [],
        Interview ? Interview.countDocuments({ user: user._id }).catch(() => 0) : 0,
      ]);

      const postReports = posts.reduce((acc, post) => {
        const pending = (post.reports || []).filter(r => r.status === "pending");
        return acc + pending.length;
      }, 0);

      res.json({
        success: true,
        data: {
          user: {
            ...user,
            id: String(user._id),
            status: user.isActive ? "active" : (user.emailVerified ? "suspended" : "pending"),
          },
          posts: posts.map(p => ({
            id: String(p._id),
            content: truncate(p.content, 200),
            type: p.type,
            status: p.status,
            likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
            commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
            reportsCount: Array.isArray(p.reports) ? p.reports.length : 0,
            createdAt: p.createdAt,
          })),
          reportsAgainst: postReports,
          pendingPostReports: postReports,
          codingActivity: {
            totalSubmissions: codingSubmissions.length,
            submissions: codingSubmissions,
          },
          interviewCount,
          violations: [], // Populated from admin logs when available
        },
      });
    } catch (error) {
      console.error("Admin user profile error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── USER RESTRICTIONS ───────────────────────────────────────────────────────
router.patch(
  "/users/:userId/restrictions",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_MODERATE]),
  async (req, res) => {
    try {
      const { canPost, canComment, canFollow, canLink } = req.body;
      const update = {};

      if (typeof canPost === "boolean") update["restrictions.canPost"] = canPost;
      if (typeof canComment === "boolean") update["restrictions.canComment"] = canComment;
      if (typeof canFollow === "boolean") update["restrictions.canFollow"] = canFollow;
      if (typeof canLink === "boolean") update["restrictions.canLink"] = canLink;

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, message: "No valid restrictions provided" });
      }

      const user = await User.findByIdAndUpdate(req.params.userId, { $set: update }, { new: true });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: "User restrictions updated",
        data: { restrictions: user.restrictions },
      });
    } catch (error) {
      console.error("Admin user restrictions error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── USER PERMISSIONS (ACCOUNT LEVEL) ────────────────────────────────────────
router.patch(
  "/users/:userId/account-permissions",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_PERMISSIONS_MANAGE]),
  async (req, res) => {
    try {
      const { privacy, notifications, account } = req.body;
      const update = {};

      if (privacy) {
        Object.entries(privacy).forEach(([key, value]) => {
          update[`preferences.privacy.${key}`] = value;
        });
      }
      if (notifications) {
        Object.entries(notifications).forEach(([key, value]) => {
          update[`preferences.notifications.${key}`] = value;
        });
      }
      if (account) {
        Object.entries(account).forEach(([key, value]) => {
          update[`preferences.account.${key}`] = value;
        });
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, message: "No valid permissions provided" });
      }

      const user = await User.findByIdAndUpdate(req.params.userId, { $set: update }, { new: true })
        .select("preferences restrictions");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: "User account permissions updated",
        data: { preferences: user.preferences, restrictions: user.restrictions },
      });
    } catch (error) {
      console.error("Admin user permissions error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── PASSWORD RESET (ADMIN) ──────────────────────────────────────────────────
router.post(
  "/users/:userId/reset-password",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_PASSWORD_RESET]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      const resetUrl = `${getFrontendBaseUrl()}/reset-password/${resetToken}`;

      res.json({
        success: true,
        message: "Password reset token generated",
        data: { resetToken, resetUrl, expiresIn: "10 minutes" },
      });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── SUSPEND WITH DETAILS ────────────────────────────────────────────────────
router.post(
  "/users/:userId/suspend-detailed",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.USERS_MODERATE]),
  async (req, res) => {
    try {
      const { reason, duration } = req.body;
      const expiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        {
          isActive: false,
          suspensionDetails: {
            reason: reason || "Suspended by admin",
            suspendedAt: new Date(),
            suspendedBy: req.user._id,
            expiresAt,
          },
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: "User suspended",
        data: { suspensionDetails: user.suspensionDetails },
      });
    } catch (error) {
      console.error("Admin suspend error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── ANALYTICS OVERVIEW ──────────────────────────────────────────────────────
router.get(
  "/analytics/overview",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([
    ADMIN_PERMISSION_KEYS.ANALYTICS_VIEW,
    ADMIN_PERMISSION_KEYS.ANALYTICS_VIEW_LIMITED,
  ]),
  async (req, res) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        dailyActiveUsers,
        monthlyActiveUsers,
        totalPosts,
        postsToday,
        totalComments,
        totalInterviews,
        interviewsThisWeek,
        totalCodingSubmissions,
        codingSubmissionsWeek,
        subscriptionStats,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
        User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
        Post.countDocuments(),
        Post.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        Comment ? Comment.countDocuments().catch(() => 0) : 0,
        Interview ? Interview.countDocuments().catch(() => 0) : 0,
        Interview ? Interview.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).catch(() => 0) : 0,
        CodingSubmission ? CodingSubmission.countDocuments().catch(() => 0) : 0,
        CodingSubmission ? CodingSubmission.countDocuments({ submittedAt: { $gte: sevenDaysAgo } }).catch(() => 0) : 0,
        User.aggregate([
          { $group: { _id: { $ifNull: ["$subscription", "free"] }, count: { $sum: 1 } } },
        ]),
      ]);

      const subs = { free: 0, basic: 0, premium: 0, enterprise: 0 };
      subscriptionStats.forEach(s => {
        const k = String(s._id || "free").toLowerCase();
        if (subs.hasOwnProperty(k)) subs[k] = s.count;
      });

      const paidUsers = subs.basic + subs.premium + subs.enterprise;
      const estimatedMRR = subs.basic * 9.99 + subs.premium * 29.99 + subs.enterprise * 99.99;

      // User growth chart data (last 7 days)
      const growthData = await User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newToday: newUsersToday,
            newThisWeek: newUsersWeek,
            newThisMonth: newUsersMonth,
            dailyActive: dailyActiveUsers,
            monthlyActive: monthlyActiveUsers,
            growthPercent: totalUsers > 0 ? ((newUsersMonth / totalUsers) * 100).toFixed(1) : 0,
          },
          engagement: {
            totalPosts,
            postsToday,
            totalComments,
            avgPostsPerUser: totalUsers > 0 ? (totalPosts / totalUsers).toFixed(1) : 0,
          },
          interviews: {
            total: totalInterviews,
            thisWeek: interviewsThisWeek,
          },
          coding: {
            totalSubmissions: totalCodingSubmissions,
            submissionsThisWeek: codingSubmissionsWeek,
          },
          revenue: {
            mrr: estimatedMRR.toFixed(2),
            paidUsers,
            subscriptions: subs,
          },
          growthChart: growthData,
        },
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── SYSTEM HEALTH ───────────────────────────────────────────────────────────
router.get(
  "/system/health",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([
    ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW,
    ADMIN_PERMISSION_KEYS.ANALYTICS_VIEW,
    ADMIN_PERMISSION_KEYS.ANALYTICS_VIEW_LIMITED,
  ]),
  async (req, res) => {
    try {
      const mongoose = require("mongoose");
      const dbState = mongoose.connection.readyState;
      const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

      const startTime = Date.now();
      await User.findOne().select("_id").lean();
      const dbLatency = Date.now() - startTime;

      const aiConfigured =
        Boolean(process.env.GEMINI_API_KEY) || Boolean(process.env.OPENAI_API_KEY);

      res.json({
        success: true,
        data: {
          services: [
            {
              name: "API Gateway",
              status: "operational",
              latency: `${Date.now() - startTime}ms`,
              uptime: "99.9%",
            },
            {
              name: "Database",
              status: dbState === 1 ? "operational" : "degraded",
              latency: `${dbLatency}ms`,
              uptime: dbState === 1 ? "99.9%" : "0%",
              details: dbStates[dbState] || "unknown",
            },
            {
              name: "AI Engine",
              status: aiConfigured ? "operational" : "degraded",
              latency: aiConfigured ? "n/a" : "n/a",
              uptime: aiConfigured ? "configured" : "not_configured",
            },
          ],
          serverUptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
        },
      });
    } catch (error) {
      console.error("System health error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── ADMIN LOGS (RECENT) ───────────────────────────────────────────────────
router.get(
  "/logs/recent",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.LOGS_VIEW]),
  async (req, res) => {
    try {
      const requested = Number(req.query.lines || 200);
      const limit = Math.min(1000, Math.max(1, requested));
      const logPath = path.join(__dirname, "..", "logs", "combined.log");

      let lines = [];
      try {
        const content = await fs.readFile(logPath, "utf8");
        lines = content
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-limit);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }

      res.json({
        success: true,
        data: {
          lines,
        },
      });
    } catch (error) {
      console.error("Admin logs recent error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── ADMIN COUPONS ───────────────────────────────────────────────────────────
router.get(
  "/coupons",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_VIEW]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
      const skip = (page - 1) * limit;
      const status = req.query.status;
      const variant = req.query.variant;
      const search = req.query.search;

      const filter = {};
      if (status) {
        const statuses = String(status)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (statuses.length) {
          filter.status = { $in: statuses };
        }
      }
      if (variant) {
        filter.variant = String(variant).trim();
      }
      if (search) {
        const escaped = escapeRegex(search);
        filter.$or = [
          { code: { $regex: escaped, $options: "i" } },
          { description: { $regex: escaped, $options: "i" } },
        ];
      }

      const [total, coupons] = await Promise.all([
        Coupon.countDocuments(filter),
        Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ]);

      res.json({
        success: true,
        data: {
          coupons,
          page,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Admin coupons list error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/coupons/usage",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_VIEW]),
  async (req, res) => {
    try {
      const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));
      const couponId = req.query.couponId;
      const couponCode = req.query.couponCode;

      const filter = {};
      if (couponId) {
        filter.couponId = couponId;
      }
      if (couponCode) {
        filter.couponCode = couponCode;
      }

      const usage = await CouponUsage.find(filter)
        .sort({ timestamp: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: {
          usage,
        },
      });
    } catch (error) {
      console.error("Admin coupons usage error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/coupons/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_VIEW]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id).lean();

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Admin coupon detail error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.post(
  "/coupons",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_MANAGE]),
  async (req, res) => {
    try {
      const payload = req.body || {};
      const code = payload.code ? String(payload.code).trim().toUpperCase() : null;
      const coupon = await Coupon.create({
        ...payload,
        code: code || generateCouponCode(payload.prefix),
      });

      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ success: false, message: "Coupon code already exists" });
      }
      console.error("Admin coupon create error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.post(
  "/coupons/bulk",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_MANAGE]),
  async (req, res) => {
    try {
      const count = Math.min(500, Math.max(1, Number(req.body?.count || 1)));
      const prefix = req.body?.prefix || "";
      const template = req.body?.template || {};
      const codes = new Set();

      while (codes.size < count) {
        codes.add(generateCouponCode(prefix));
      }

      const docs = Array.from(codes).map((code) => ({
        ...template,
        code,
        prefix: template.prefix ?? prefix,
      }));

      const created = await Coupon.insertMany(docs, { ordered: false });

      res.status(201).json({ success: true, data: { coupons: created } });
    } catch (error) {
      console.error("Admin coupons bulk error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.patch(
  "/coupons/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_MANAGE]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      if (updates.code) {
        updates.code = String(updates.code).trim().toUpperCase();
      }

      const coupon = await Coupon.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ success: false, message: "Coupon code already exists" });
      }
      console.error("Admin coupon update error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.patch(
  "/coupons/:id/status",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_MANAGE]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const status = String(req.body?.status || "").trim();

      const coupon = await Coupon.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Admin coupon status error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.delete(
  "/coupons/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.SETTINGS_MANAGE]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByIdAndDelete(id);

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Admin coupon delete error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── AI USAGE ────────────────────────────────────────────────────────────────
router.get(
  "/ai/usage",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.AI_VIEW]),
  async (req, res) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [aiConfigured, aiValid, totalInterviews, interviewsToday] = await Promise.all([
        User.countDocuments({ "aiCompanion.geminiApiKey": { $exists: true, $ne: "" } }),
        User.countDocuments({ "aiCompanion.isApiKeyValid": true }),
        Interview ? Interview.countDocuments().catch(() => 0) : 0,
        Interview
          ? Interview.find({ createdAt: { $gte: oneDayAgo } })
              .select("questions status")
              .lean()
              .catch(() => [])
          : [],
      ]);

      const requestsToday = interviewsToday.reduce((count, interview) => {
        const questionCount = Array.isArray(interview.questions)
          ? interview.questions.length
          : 0;
        return count + Math.max(1, questionCount);
      }, 0);

      const errorsToday = interviewsToday.filter(
        (interview) => interview.status === "cancelled"
      ).length;

      const estimatedCost = (requestsToday * 0.0012).toFixed(2);

      res.json({
        success: true,
        data: {
          configuredUsers: aiConfigured,
          validApiKeys: aiValid,
          totalAIInterviews: totalInterviews,
          usage: {
            requestsToday,
            errorsToday,
            estimatedCost: `$${estimatedCost}`,
          },
        },
      });
    } catch (error) {
      console.error("Admin AI usage error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── CODING PROBLEMS MANAGEMENT ──────────────────────────────────────────────
router.get(
  "/coding/problems",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CODING_VIEW]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const status = String(req.query.status || "").trim().toLowerCase();
      const search = String(req.query.search || "").trim();

      const where = {};
      if (status) where.approvalStatus = status;
      if (search) {
        const safeRegex = new RegExp(escapeRegex(search), "i");
        where.$or = [
          { title: safeRegex },
          { tags: { $in: [safeRegex] } },
        ];
      }

      const [total, problems] = await Promise.all([
        CodingProblem.countDocuments(where),
        CodingProblem.find(where)
          .select("title difficulty tags approvalStatus createdBy createdAt")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("createdBy", "name username")
          .lean(),
      ]);

      res.json({
        success: true,
        data: {
          problems: problems.map(p => ({
            id: String(p._id),
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags || [],
            status: p.approvalStatus || "approved",
            createdBy: p.createdBy ? { id: String(p.createdBy._id), name: p.createdBy.name, username: p.createdBy.username } : null,
            createdAt: p.createdAt,
          })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error("Admin coding problems error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/coding/problems/:problemId",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CODING_VIEW]),
  async (req, res) => {
    try {
      const problem = await CodingProblem.findById(req.params.problemId).lean();
      if (!problem) {
        return res.status(404).json({ success: false, message: "Problem not found" });
      }

      const [
        totalSubmissionCount,
        acceptedSubmissionCount,
        recentSubmissions,
        languageDistributionRaw,
        solverAggregates,
        solveRateTrendRaw,
      ] = await Promise.all([
        CodingSubmission.countDocuments({ problem: problem._id }),
        CodingSubmission.countDocuments({ problem: problem._id, status: "Accepted" }),
        CodingSubmission.find({ problem: problem._id })
          .select(
            "user language status runtimeMs memoryKb passedTestCases totalTestCases code createdAt testResults"
          )
          .sort({ createdAt: -1 })
          .limit(200)
          .populate("user", "name email profilePicture")
          .lean(),
        CodingSubmission.aggregate([
          { $match: { problem: problem._id } },
          {
            $group: {
              _id: "$language",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        CodingSubmission.aggregate([
          { $match: { problem: problem._id, status: "Accepted", user: { $exists: true } } },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: "$user",
              solvedAt: { $first: "$createdAt" },
              attempts: { $sum: 1 },
              bestRuntimeMs: { $min: { $ifNull: ["$runtimeMs", Number.MAX_SAFE_INTEGER] } },
              bestLanguage: { $first: "$language" },
            },
          },
          { $sort: { solvedAt: 1 } },
          { $limit: 200 },
        ]),
        CodingSubmission.aggregate([
          {
            $match: {
              problem: problem._id,
              createdAt: {
                $gte: new Date(Date.now() - 6 * 31 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              attempts: { $sum: 1 },
              accepted: {
                $sum: {
                  $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

      const problemAcceptance = problem.acceptance || {};
      const attempted = Number(
        problemAcceptance.totalSubmissions || totalSubmissionCount || 0
      );
      const solved = Number(
        problemAcceptance.totalAccepted || acceptedSubmissionCount || 0
      );
      const solveRate = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;

      const formatSubmissionStatus = (status) => {
        const normalized = String(status || "").toLowerCase();
        if (normalized === "accepted") return "accepted";
        if (normalized.includes("wrong")) return "wrong_answer";
        if (normalized.includes("time limit")) return "time_limit_exceeded";
        if (normalized.includes("runtime")) return "runtime_error";
        return "compile_error";
      };

      const fallbackColors = [
        "bg-blue-500",
        "bg-purple-500",
        "bg-teal-500",
        "bg-rose-500",
        "bg-amber-500",
        "bg-indigo-500",
      ];

      const pickColor = (seed) => {
        const raw = String(seed || "x");
        let hash = 0;
        for (let i = 0; i < raw.length; i += 1) {
          hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
        }
        return fallbackColors[hash % fallbackColors.length];
      };

      const formatInitials = (name) => {
        return String(name || "User")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("");
      };

      const submissions = recentSubmissions.map((submission) => {
        const failedTestResult = Array.isArray(submission.testResults)
          ? submission.testResults.find((result) => !result.passed)
          : null;

        const userRecord = submission.user || {};
        const userName = String(userRecord.name || "User");
        const userEmail = String(userRecord.email || "unknown@example.com");

        return {
          id: String(submission._id),
          user: {
            id: String(userRecord._id || ""),
            name: userName,
            email: userEmail,
            initials: formatInitials(userName),
            color: pickColor(userRecord._id || userEmail),
          },
          language: String(submission.language || "unknown"),
          status: formatSubmissionStatus(submission.status),
          runtime: Number.isFinite(Number(submission.runtimeMs))
            ? `${Number(submission.runtimeMs)}ms`
            : "—",
          memory:
            Number.isFinite(Number(submission.memoryKb)) && Number(submission.memoryKb) > 0
              ? `${(Number(submission.memoryKb) / 1024).toFixed(1)}MB`
              : "—",
          submittedAt: submission.createdAt,
          code: String(submission.code || ""),
          output: failedTestResult?.actualOutput || undefined,
          errorMessage:
            submission.status === "Accepted"
              ? undefined
              : failedTestResult?.status || submission.status,
          passedTests: Number(submission.passedTestCases || 0),
          totalTests: Number(submission.totalTestCases || 0),
        };
      });

      const solverUserIds = solverAggregates
        .map((aggregate) => aggregate._id)
        .filter(Boolean);
      const solverUsers = solverUserIds.length
        ? await User.find({ _id: { $in: solverUserIds } })
            .select("name email")
            .lean()
        : [];
      const solverUserMap = new Map(
        solverUsers.map((user) => [String(user._id), user])
      );

      const solvers = solverAggregates.map((aggregate) => {
        const userRecord = solverUserMap.get(String(aggregate._id));
        const userName = String(userRecord?.name || "User");
        const userEmail = String(userRecord?.email || "unknown@example.com");

        return {
          user: {
            id: String(aggregate._id),
            name: userName,
            email: userEmail,
            initials: formatInitials(userName),
            color: pickColor(aggregate._id || userEmail),
          },
          solvedAt: aggregate.solvedAt || null,
          timeTaken: null,
          attempts: Number(aggregate.attempts || 0),
          bestRuntime:
            Number.isFinite(Number(aggregate.bestRuntimeMs)) &&
            Number(aggregate.bestRuntimeMs) !== Number.MAX_SAFE_INTEGER
              ? `${Number(aggregate.bestRuntimeMs)}ms`
              : "—",
          bestLanguage: String(aggregate.bestLanguage || "unknown"),
        };
      });

      const languageColors = [
        "#3b82f6",
        "#8b5cf6",
        "#f59e0b",
        "#10b981",
        "#ef4444",
        "#14b8a6",
      ];

      const languageDistribution = languageDistributionRaw.map((entry, index) => ({
        lang: String(entry._id || "unknown"),
        count: Number(entry.count || 0),
        color: languageColors[index % languageColors.length],
      }));

      const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const trendMap = new Map(
        solveRateTrendRaw.map((entry) => {
          const key = `${entry._id?.year || 0}-${entry._id?.month || 0}`;
          const attemptsCount = Number(entry.attempts || 0);
          const acceptedCount = Number(entry.accepted || 0);

          return [
            key,
            {
              attempts: attemptsCount,
              rate:
                attemptsCount > 0
                  ? Math.round((acceptedCount / attemptsCount) * 100)
                  : 0,
            },
          ];
        })
      );

      const solveRateTrend = [];
      const now = new Date();
      for (let i = 5; i >= 0; i -= 1) {
        const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${bucketDate.getFullYear()}-${bucketDate.getMonth() + 1}`;
        const metric = trendMap.get(key) || { attempts: 0, rate: 0 };

        solveRateTrend.push({
          date: monthLabels[bucketDate.getMonth()],
          rate: metric.rate,
          attempts: metric.attempts,
        });
      }

      const visibleTestCases = Array.isArray(problem.publicTestCases) && problem.publicTestCases.length > 0
        ? problem.publicTestCases
        : Array.isArray(problem.sampleTestCases)
          ? problem.sampleTestCases
          : [];
      const hiddenTestCases = Array.isArray(problem.hiddenTestCases)
        ? problem.hiddenTestCases
        : [];

      const testCases = [
        ...visibleTestCases.map((testCase, index) => ({
          id: `public-${index}`,
          input: String(testCase.input || ""),
          expectedOutput: String(testCase.expectedOutput || ""),
          hidden: false,
        })),
        ...hiddenTestCases.map((testCase, index) => ({
          id: `hidden-${index}`,
          input: String(testCase.input || ""),
          expectedOutput: String(testCase.expectedOutput || ""),
          hidden: true,
        })),
      ];

      const examples = Array.isArray(problem.sampleTestCases)
        ? problem.sampleTestCases.map((testCase) => ({
            input: String(testCase.input || ""),
            output: String(testCase.expectedOutput || ""),
            explanation: String(testCase.explanation || ""),
          }))
        : [];

      const bestRuntimeMs = submissions
        .map((submission) => Number.parseInt(String(submission.runtime || "0"), 10))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b)[0];

      const avgAttempts = solvers.length > 0
        ? Number(
            (
              solvers.reduce((sum, solver) => sum + Number(solver.attempts || 0), 0) /
              solvers.length
            ).toFixed(1)
          )
        : 0;

      res.json({
        success: true,
        data: {
          problem: {
            id: String(problem._id),
            title: String(problem.title || "Untitled problem"),
            difficulty: String(problem.difficulty || "Easy").toLowerCase(),
            category: Array.isArray(problem.tags) && problem.tags.length > 0
              ? String(problem.tags[0])
              : "General",
            tags: Array.isArray(problem.tags) ? problem.tags : [],
            solved,
            attempted,
            status: String(problem.approvalStatus || "approved") === "approved" ? "active" : "draft",
            description: String(problem.description || ""),
            constraints: Array.isArray(problem.constraints)
              ? problem.constraints.join("\n")
              : String(problem.constraints || ""),
            examples,
            testCases,
            createdAt: problem.createdAt,
            updatedAt: problem.updatedAt,
            solveRate,
          },
          submissions,
          solvers,
          analytics: {
            solveRateTrend,
            languageDistribution,
            avgAttempts,
            bestRuntime: Number.isFinite(bestRuntimeMs) ? `${bestRuntimeMs}ms` : "—",
          },
        },
      });
    } catch (error) {
      console.error("Admin coding problem detail error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.patch(
  "/coding/problems/:problemId",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CODING_MODERATE]),
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.title) updates.title = req.body.title;
      if (req.body.difficulty) updates.difficulty = req.body.difficulty;
      if (req.body.approvalStatus) updates.approvalStatus = req.body.approvalStatus;
      if (req.body.tags) updates.tags = req.body.tags;

      const problem = await CodingProblem.findByIdAndUpdate(req.params.problemId, updates, { new: true });
      if (!problem) {
        return res.status(404).json({ success: false, message: "Problem not found" });
      }

      res.json({ success: true, message: "Problem updated", data: { problem } });
    } catch (error) {
      console.error("Admin coding problem update error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

router.delete(
  "/coding/problems/:problemId",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.CODING_DELETE]),
  async (req, res) => {
    try {
      const problem = await CodingProblem.findByIdAndDelete(req.params.problemId);
      if (!problem) {
        return res.status(404).json({ success: false, message: "Problem not found" });
      }
      res.json({ success: true, message: "Problem deleted" });
    } catch (error) {
      console.error("Admin coding problem delete error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

// ─── ADMIN ROLE MANAGEMENT ───────────────────────────────────────────────────
router.patch(
  "/users/:userId/admin-role",
  authenticateToken,
  authorizeRoles(["admin"]),
  authorizeAdminPermissions([ADMIN_PERMISSION_KEYS.ADMINS_MANAGE]),
  async (req, res) => {
    try {
      const { adminRole } = req.body;
      const normalizedRole = parseRequestedAdminRole(adminRole, null);

      if (!normalizedRole) {
        return res.status(400).json({ success: false, message: "Invalid admin role" });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (user.role !== "admin") {
        user.role = "admin";
      }
      user.adminRole = normalizedRole;
      await user.save();

      res.json({
        success: true,
        message: "Admin role updated",
        data: { user: mapUserRecord(user) },
      });
    } catch (error) {
      console.error("Admin role update error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

module.exports = router;
