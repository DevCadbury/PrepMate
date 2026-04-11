const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
  authenticateToken,
  authorizeRoles,
  hasAdminPermission,
} = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const SupportTicket = require("../models/SupportTicket");

const SUPPORT_CATEGORIES = ["help", "bug", "billing", "abuse", "other"];
const SUPPORT_PRIORITIES = ["low", "medium", "high", "urgent"];
const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"];

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const requireSupportViewAccess = (req, res, next) => {
  if (req.user?.role === "support") {
    return next();
  }

  if (req.user?.role === "admin") {
    if (hasAdminPermission(req.user, ["admin.help.view", "admin.help.manage"])) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Help-center view permission is required.",
    });
  }

  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};

const requireSupportManageAccess = (req, res, next) => {
  if (req.user?.role === "support") {
    return next();
  }

  if (req.user?.role === "admin") {
    if (hasAdminPermission(req.user, "admin.help.manage")) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Help-center management permission is required.",
    });
  }

  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const formatTicket = (ticket) => ({
  id: String(ticket._id),
  subject: ticket.subject,
  description: ticket.description,
  category: ticket.category,
  priority: ticket.priority,
  status: ticket.status,
  adminNotes: ticket.adminNotes || "",
  user: ticket.user
    ? {
        id: String(ticket.user._id || ticket.user),
        name: ticket.user.name,
        username: ticket.user.username,
        email: ticket.user.email,
        profilePicture: ticket.user.profilePicture,
      }
    : null,
  assignedTo: ticket.assignedTo
    ? {
        id: String(ticket.assignedTo._id || ticket.assignedTo),
        name: ticket.assignedTo.name,
        username: ticket.assignedTo.username,
      }
    : null,
  attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

router.use(authenticateToken);

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        categories: SUPPORT_CATEGORIES,
        priorities: SUPPORT_PRIORITIES,
        statuses: SUPPORT_STATUSES,
      },
    });
  })
);

router.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const subject = String(req.body.subject || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "help").trim().toLowerCase();
    const priority = String(req.body.priority || "medium").trim().toLowerCase();

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    if (!SUPPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported category: ${category}`,
      });
    }

    if (!SUPPORT_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported priority: ${priority}`,
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      category,
      priority,
      logs: [
        {
          actor: req.user._id,
          action: "created",
          note: "Ticket created",
        },
      ],
    });

    const populated = await SupportTicket.findById(ticket._id)
      .populate("user", "name username email profilePicture")
      .populate("assignedTo", "name username")
      .lean();

    res.status(201).json({
      success: true,
      data: {
        ticket: formatTicket(populated),
      },
    });
  })
);

router.get(
  "/my-tickets",
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));

    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("user", "name username email profilePicture")
      .populate("assignedTo", "name username")
      .lean();

    res.json({
      success: true,
      data: {
        tickets: tickets.map(formatTicket),
      },
    });
  })
);

router.get(
  "/tickets",
  authorizeRoles(["admin", "support"]),
  requireSupportViewAccess,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const status = String(req.query.status || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim().toLowerCase();
    const search = String(req.query.search || "").trim();

    const where = {};
    if (SUPPORT_STATUSES.includes(status)) {
      where.status = status;
    }
    if (SUPPORT_CATEGORIES.includes(category)) {
      where.category = category;
    }
    if (search) {
      const safeRegex = new RegExp(escapeRegex(search), "i");
      where.$or = [
        { subject: safeRegex },
        { description: safeRegex },
      ];
    }

    const [total, tickets] = await Promise.all([
      SupportTicket.countDocuments(where),
      SupportTicket.find(where)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name username email profilePicture")
        .populate("assignedTo", "name username")
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        tickets: tickets.map(formatTicket),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

router.get(
  "/tickets/:ticketId",
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate("user", "name username email profilePicture")
      .populate("assignedTo", "name username")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isOwner = String(ticket.user?._id || ticket.user) === String(req.user._id);
    const isStaff = ["admin", "support"].includes(String(req.user.role || ""));

    if (req.user.role === "admin" && !hasAdminPermission(req.user, ["admin.help.view", "admin.help.manage"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Help-center view permission is required.",
      });
    }

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: {
        ticket: formatTicket(ticket),
      },
    });
  })
);

router.patch(
  "/tickets/:ticketId",
  authorizeRoles(["admin", "support"]),
  requireSupportManageAccess,
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const nextStatus = String(req.body.status || "").trim().toLowerCase();
    const nextPriority = String(req.body.priority || "").trim().toLowerCase();
    const adminNotes =
      req.body.adminNotes === undefined
        ? undefined
        : String(req.body.adminNotes || "").trim();
    const assignedTo = req.body.assignedTo;

    if (nextStatus && !SUPPORT_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported status: ${nextStatus}`,
      });
    }

    if (nextPriority && !SUPPORT_PRIORITIES.includes(nextPriority)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported priority: ${nextPriority}`,
      });
    }

    if (nextStatus) {
      ticket.status = nextStatus;
      ticket.logs.push({
        actor: req.user._id,
        action: "status_updated",
        note: `Status changed to ${nextStatus}`,
      });
    }

    if (nextPriority) {
      ticket.priority = nextPriority;
      ticket.logs.push({
        actor: req.user._id,
        action: "priority_updated",
        note: `Priority changed to ${nextPriority}`,
      });
    }

    if (adminNotes !== undefined) {
      ticket.adminNotes = adminNotes;
      ticket.logs.push({
        actor: req.user._id,
        action: "note_updated",
        note: "Admin notes updated",
      });
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        ticket.assignedTo = undefined;
      } else {
        if (!isValidObjectId(String(assignedTo))) {
          return res.status(400).json({
            success: false,
            message: "Invalid assignee id",
          });
        }
        ticket.assignedTo = assignedTo;
      }

      ticket.logs.push({
        actor: req.user._id,
        action: "assignment_updated",
        note: "Ticket assignment updated",
      });
    }

    await ticket.save();

    const updated = await SupportTicket.findById(ticket._id)
      .populate("user", "name username email profilePicture")
      .populate("assignedTo", "name username")
      .lean();

    res.json({
      success: true,
      data: {
        ticket: formatTicket(updated),
      },
    });
  })
);

module.exports = router;
