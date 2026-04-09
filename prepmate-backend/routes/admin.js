const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Post = require("../models/Post");
const Message = require("../models/Message");
const CodingProblem = require("../models/CodingProblem");
const SupportTicket = require("../models/SupportTicket");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

const USER_ROLES = ["student", "teacher", "hr", "admin", "support"];
const POST_STATUSES = ["active", "archived", "deleted", "hidden"];
const CHAT_REVIEW_ACTIONS = new Set(["resolved", "dismissed", "blocked"]);

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
  status: mapUserStatus(user),
  joinDate: user.createdAt,
  lastLogin: user.lastLogin || user.createdAt,
  subscription: user.subscription || "free",
  permissions: user.permissions || [],
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
  "/dashboard",
  authenticateToken,
  authorizeRoles(["admin"]),
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
  "/users",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const search = String(req.query.search || "").trim();
      const role = String(req.query.role || "").trim().toLowerCase();
      const status = String(req.query.status || "").trim().toLowerCase();

      const where = {};

      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
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
  async (req, res) => {
    try {
      const { permissions } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { permissions: Array.isArray(permissions) ? permissions : [] },
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
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.get(
  "/social/posts",
  authenticateToken,
  authorizeRoles(["admin"]),
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
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
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
  async (req, res) => {
    try {
      const nextStatus = String(req.body.status || "").trim().toLowerCase();
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
  async (req, res) => {
    try {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.permissions?.includes("admin_creation")) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to create admin accounts",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.json({
        success: true,
        token: `admin_${token}`,
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
    const { token, name, email, password } = req.body;

    if (!String(token || "").startsWith("admin_")) {
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

    const adminUser = new User({
      name,
      email,
      password,
      role: "admin",
      isActive: true,
      emailVerified: true,
      permissions: ["user_management", "analytics_view"],
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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
