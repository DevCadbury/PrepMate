const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET || "fallback-secret-key", {
    expiresIn: expiresIn || process.env.JWT_EXPIRE,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key");
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// Decode token without verification (for getting payload)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

// Get token from authorization header
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
};

// Middleware to verify JWT token
const verifyTokenMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(["admin"]);

// Middleware to check if user is teacher or admin
const requireTeacher = requireRole(["teacher", "admin"]);

// Middleware to check if user is HR or admin
const requireHR = requireRole(["hr", "admin"]);

// Middleware to check if user is support or admin
const requireSupport = requireRole(["support", "admin"]);

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenFromHeader,
  verifyTokenMiddleware,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireHR,
  requireSupport,
};
