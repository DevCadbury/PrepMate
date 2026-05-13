const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler").asyncHandler;
const logger = require("../utils/logger");
const { isTokenBlacklisted } = require("../utils/tokenBlacklist");

const ADMIN_PERMISSION_CATALOG = Object.freeze([
  {
    key: "admin.dashboard.view",
    module: "dashboard",
    label: "View dashboard",
    description: "Access admin dashboard and overview widgets.",
  },
  {
    key: "admin.users.view",
    module: "users",
    label: "View users",
    description: "Browse users and user profile details.",
  },
  {
    key: "admin.users.moderate",
    module: "users",
    label: "Moderate users",
    description: "Suspend, activate, and apply user restrictions.",
  },
  {
    key: "admin.users.delete",
    module: "users",
    label: "Delete users",
    description: "Permanently delete user accounts.",
  },
  {
    key: "admin.users.role.assign",
    module: "users",
    label: "Assign roles",
    description: "Change user role and admin sub-role assignments.",
  },
  {
    key: "admin.users.permissions.manage",
    module: "users",
    label: "Manage custom permissions",
    description: "Manage custom permission grants for users.",
  },
  {
    key: "admin.users.password.reset",
    module: "users",
    label: "Reset passwords",
    description: "Generate password reset links for users.",
  },
  {
    key: "admin.content.view",
    module: "content",
    label: "View moderated content",
    description: "View reported or filtered social content.",
  },
  {
    key: "admin.content.moderate",
    module: "content",
    label: "Moderate content",
    description: "Approve, hide, or remove reported content.",
  },
  {
    key: "admin.chatreports.view",
    module: "content",
    label: "View chat reports",
    description: "View chat abuse reports and moderation queue.",
  },
  {
    key: "admin.chatreports.moderate",
    module: "content",
    label: "Moderate chat reports",
    description: "Resolve, dismiss, or block reported chat messages.",
  },
  {
    key: "admin.analytics.view",
    module: "analytics",
    label: "View analytics",
    description: "View full analytics dashboards and datasets.",
  },
  {
    key: "admin.analytics.view.limited",
    module: "analytics",
    label: "View limited analytics",
    description: "View high-level analytics summaries only.",
  },
  {
    key: "admin.ai.view",
    module: "ai",
    label: "View AI metrics",
    description: "View AI usage, validity, and health indicators.",
  },
  {
    key: "admin.coding.view",
    module: "coding",
    label: "View coding catalog",
    description: "View coding problems and moderation status.",
  },
  {
    key: "admin.coding.moderate",
    module: "coding",
    label: "Moderate coding problems",
    description: "Approve, reject, and edit coding problems.",
  },
  {
    key: "admin.coding.delete",
    module: "coding",
    label: "Delete coding problems",
    description: "Delete coding problems permanently.",
  },
  {
    key: "admin.help.view",
    module: "help",
    label: "View help center",
    description: "View support tickets and help-center data.",
  },
  {
    key: "admin.help.manage",
    module: "help",
    label: "Manage help center",
    description: "Update support tickets and assign help center workflow.",
  },
  {
    key: "admin.settings.view",
    module: "settings",
    label: "View settings",
    description: "Access admin settings panels.",
  },
  {
    key: "admin.settings.manage",
    module: "settings",
    label: "Manage settings",
    description: "Update platform admin settings.",
  },
  {
    key: "admin.logs.view",
    module: "security",
    label: "View logs",
    description: "Read system audit and activity logs.",
  },
  {
    key: "admin.tokens.generate",
    module: "security",
    label: "Generate admin invites",
    description: "Generate admin invite tokens.",
  },
  {
    key: "admin.admins.manage",
    module: "security",
    label: "Manage admins",
    description: "Manage admin roles and elevated access.",
  },
  {
    key: "admin.admins.create",
    module: "security",
    label: "Create admins",
    description: "Create new admin accounts.",
  },
]);

const ADMIN_ROLE_PERMISSION_DEFAULTS = Object.freeze({
  superadmin: ["*"],
  moderator: [
    "admin.dashboard.view",
    "admin.users.view",
    "admin.users.moderate",
    "admin.content.view",
    "admin.content.moderate",
    "admin.chatreports.view",
    "admin.chatreports.moderate",
    "admin.analytics.view.limited",
    "admin.coding.view",
    "admin.coding.moderate",
    "admin.help.view",
    "admin.logs.view",
    "admin.settings.view",
  ],
  support_admin: [
    "admin.dashboard.view",
    "admin.users.view",
    "admin.users.password.reset",
    "admin.help.view",
    "admin.help.manage",
    "admin.logs.view",
    "admin.settings.view",
  ],
  analytics_admin: [
    "admin.dashboard.view",
    "admin.analytics.view",
    "admin.ai.view",
    "admin.logs.view",
    "admin.settings.view",
  ],
});

const LEGACY_ADMIN_PERMISSION_ALIASES = Object.freeze({
  user_management: [
    "admin.users.view",
    "admin.users.moderate",
    "admin.users.role.assign",
  ],
  analytics_view: ["admin.analytics.view", "admin.ai.view"],
  admin_creation: [
    "admin.tokens.generate",
    "admin.admins.create",
    "admin.admins.manage",
  ],
});

const normalizeAdminPermissionKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeAdminRole = (value) => {
  const role = String(value || "")
    .trim()
    .toLowerCase();
  if (Object.prototype.hasOwnProperty.call(ADMIN_ROLE_PERMISSION_DEFAULTS, role)) {
    return role;
  }
  return "superadmin";
};

const expandLegacyPermission = (permission) => {
  const normalized = normalizeAdminPermissionKey(permission);
  if (!normalized) {
    return [];
  }

  const aliased = LEGACY_ADMIN_PERMISSION_ALIASES[normalized];
  if (Array.isArray(aliased) && aliased.length > 0) {
    return aliased.map(normalizeAdminPermissionKey);
  }

  return [normalized];
};

const getCustomAdminPermissions = (user) => {
  const input = Array.isArray(user?.permissions) ? user.permissions : [];

  const flattened = input.flatMap((permission) =>
    expandLegacyPermission(permission)
  );

  return Array.from(new Set(flattened.filter(Boolean)));
};

const getEffectiveAdminPermissions = (user) => {
  if (!user || user.role !== "admin") {
    return [];
  }

  const adminRole = normalizeAdminRole(user.adminRole || "superadmin");
  const roleDefaults = ADMIN_ROLE_PERMISSION_DEFAULTS[adminRole] || [];
  const customPermissions = getCustomAdminPermissions(user);

  const effective = Array.from(
    new Set([...roleDefaults, ...customPermissions].map(normalizeAdminPermissionKey))
  );

  if (effective.includes("*")) {
    return ["*"];
  }

  return effective.sort();
};

const doesPermissionMatch = (grantedPermission, requiredPermission) => {
  if (!grantedPermission || !requiredPermission) {
    return false;
  }

  if (grantedPermission === "*") {
    return true;
  }

  if (grantedPermission.endsWith(".*")) {
    const prefix = grantedPermission.slice(0, -1);
    return requiredPermission.startsWith(prefix);
  }

  return grantedPermission === requiredPermission;
};

const hasAdminPermission = (user, requiredPermissions, options = {}) => {
  if (!user || user.role !== "admin") {
    return false;
  }

  const required = (Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions]
  )
    .map(normalizeAdminPermissionKey)
    .filter(Boolean);

  if (required.length === 0) {
    return true;
  }

  const matchMode = options.mode === "all" ? "all" : "any";
  const effectivePermissions = getEffectiveAdminPermissions(user);

  if (effectivePermissions.includes("*")) {
    return true;
  }

  const checker = (permission) =>
    effectivePermissions.some((grantedPermission) =>
      doesPermissionMatch(grantedPermission, permission)
    );

  return matchMode === "all"
    ? required.every(checker)
    : required.some(checker);
};

const authorizeAdminPermissions = (requiredPermissions = [], options = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const required = (Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]
    )
      .map(normalizeAdminPermissionKey)
      .filter(Boolean);

    const effectivePermissions = getEffectiveAdminPermissions(req.user);
    req.effectiveAdminPermissions = effectivePermissions;

    if (required.length === 0) {
      return next();
    }

    const allowed = hasAdminPermission(req.user, required, {
      mode: options.mode,
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Your admin permissions do not allow this action.",
        requiredPermissions: required,
      });
    }

    next();
  };
};

// @desc    Verify JWT token and attach user to request
// @access  Protected routes
const authenticateToken = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: "Token has been revoked. Please log in again.",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address before accessing this feature.",
        requiresEmailVerification: true,
        emailVerified: false,
        resendVerificationAvailable: true,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Token verification error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Token verification failed.",
    });
  }
});

// @desc    Authorize roles
// @access  Role-based routes
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized to access this resource.`,
      });
    }

    next();
  };
};

// @desc    Authorize admin sub-roles (superadmin, moderator, support_admin, analytics_admin)
// @access  Admin-only routes with granular permission
const authorizeAdminRoles = (adminRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    // Super admin bypasses all sub-role checks
    const userAdminRole = normalizeAdminRole(req.user.adminRole || "superadmin");
    if (userAdminRole === "superadmin") {
      return next();
    }

    if (!adminRoles.includes(userAdminRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${userAdminRole} role is not authorized for this action.`,
      });
    }

    next();
  };
};

// @desc    Optional authentication (for public routes that can work with or without auth)
// @access  Public routes
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      logger.warn("Optional auth failed:", error.message);
    }
  }

  next();
});

// @desc    Check if user has active subscription (for premium features)
// @access  Premium routes
const requireSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Admin and teacher roles have access to all features
  if (req.user.role === "admin" || req.user.role === "teacher") {
    return next();
  }

  // Check if user has active subscription
  if (!req.user.canAccessPremium()) {
    return res.status(403).json({
      success: false,
      message: "Premium subscription required for this feature.",
    });
  }

  next();
};

// @desc    Rate limiting middleware (basic implementation)
// @access  All routes
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(ip)) {
      requests.set(
        ip,
        requests.get(ip).filter((timestamp) => timestamp > windowStart)
      );
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    userRequests.push(now);
    next();
  };
};

// @desc    Check if user owns the resource or is admin
// @access  Resource-specific routes
const checkOwnership = (resourceModel, resourceIdParam = "id") => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: "Resource ID is required.",
      });
    }

    // Admin can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    try {
      // Get the resource and check ownership
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found.",
        });
      }

      // Check if user owns the resource
      if (resource.userId && resource.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't own this resource.",
        });
      }

      // Attach resource to request for later use
      req.resource = resource;
      next();
    } catch (error) {
      logger.error("Ownership check error:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking resource ownership.",
      });
    }
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeAdminRoles,
  authorizeAdminPermissions,
  hasAdminPermission,
  getEffectiveAdminPermissions,
  normalizeAdminPermissionKey,
  normalizeAdminRole,
  ADMIN_PERMISSION_CATALOG,
  ADMIN_ROLE_PERMISSION_DEFAULTS,
  optionalAuth,
  requireSubscription,
  rateLimit,
  checkOwnership,
};
