const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler").asyncHandler;
const logger = require("../utils/logger");
const { isTokenBlacklisted } = require("../utils/tokenBlacklist");

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
  optionalAuth,
  requireSubscription,
  rateLimit,
  checkOwnership,
};
