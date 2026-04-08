const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const teacherRoutes = require("./routes/teacher");
const socialRoutes = require("./routes/social");
const profileRoutes = require("./routes/profile");
const usersRoutes = require("./routes/users");
const notificationsRoutes = require("./routes/notifications");
const commentsRoutes = require("./routes/comments");
const chatRoutes = require("./routes/chat");
const healthRoutes = require("./routes/health");
const aiRoutes = require("./routes/ai");

// Import utilities
const logger = require("./utils/logger");
const socketHandler = require("./socket/socketHandler");

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e8, // 100MB for large messages
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  transports: ["websocket", "polling"],
});

// Initialize socket handler
socketHandler.initialize(io);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
// Very lenient rate limiter for Google OAuth routes
const googleOAuthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs for Google OAuth
  message:
    "Too many Google OAuth requests from this IP, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false,
});

// More lenient rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs for auth
  message:
    "Too many authentication requests from this IP, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

// General rate limiter for other API routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs for general API
  message: "Too many requests from this IP, please try again later.",
  skipSuccessfulRequests: false,
});

// Apply rate limiters
app.use("/api/auth/google", googleOAuthLimiter); // Very lenient for Google OAuth
app.use("/api/auth", authLimiter); // More lenient for auth
app.use("/api/", apiLimiter); // General API rate limiting

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use(express.static("public"));

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No content response
});

// Session middleware
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/social", socialRoutes);
// Profile routes - uncommented to fix profile update functionality
app.use("/api/profile", profileRoutes);
app.use("/api/users", usersRoutes);
// Notifications routes - uncommented to fix notification fetching
app.use("/api/notifications", notificationsRoutes);
app.use("/api/social/notifications", notificationsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

// Health check routes
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Serve health dashboard
app.get("/health-dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/health.html");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("=== SERVER ERROR ===");
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  console.error("Request URL:", req.url);
  console.error("Request method:", req.method);
  console.error("Request headers:", req.headers);
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate";
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK;
const MONGODB_URI_LOCAL =
  process.env.MONGODB_URI_LOCAL || "mongodb://127.0.0.1:27017/prepmate";
const ALLOW_START_WITHOUT_DB =
  process.env.ALLOW_START_WITHOUT_DB === "true" ||
  process.env.NODE_ENV !== "production";

const maskMongoUri = (uri) => {
  try {
    return uri.replace(/:\/\/([^:@]+):([^@]+)@/, "://***:***@");
  } catch {
    return uri;
  }
};

const buildNonSrvAtlasUri = (uri) => {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "mongodb+srv:") {
      return null;
    }

    const hostParts = parsed.hostname.split(".");
    if (hostParts.length < 3) {
      return null;
    }

    const clusterName = hostParts[0];
    const domain = hostParts.slice(1).join(".");
    const seeds = [
      `${clusterName}-shard-00-00.${domain}:27017`,
      `${clusterName}-shard-00-01.${domain}:27017`,
      `${clusterName}-shard-00-02.${domain}:27017`,
    ].join(",");

    const credentials = parsed.username
      ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
      : "";

    const dbPath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/prepmate";
    const params = new URLSearchParams(parsed.search);
    params.delete("appName");
    if (!params.has("ssl")) params.set("ssl", "true");
    if (!params.has("authSource")) params.set("authSource", "admin");

    return `mongodb://${credentials}${seeds}${dbPath}?${params.toString()}`;
  } catch {
    return null;
  }
};

const resolveMongoUris = () => {
  const derivedFallback = buildNonSrvAtlasUri(MONGODB_URI);
  const uris = [
    MONGODB_URI,
    MONGODB_URI_FALLBACK,
    derivedFallback,
    MONGODB_URI_LOCAL,
  ].filter(Boolean);
  return [...new Set(uris)];
};

const connectMongoWithFallback = async () => {
  const candidates = resolveMongoUris();

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log(`Connected to MongoDB using: ${maskMongoUri(uri)}`);
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt failed: ${maskMongoUri(uri)}`);
      console.error(err.message);
    }
  }

  return false;
};

const startHttpServer = () => {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Set PORT to a free port.`);
    } else {
      console.error("HTTP server startup error:", err);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Socket.IO server initialized");
  });
};

connectMongoWithFallback()
  .then((isConnected) => {
    if (isConnected) {
      startHttpServer();
      return;
    }

    if (ALLOW_START_WITHOUT_DB) {
      console.warn(
        "Starting server without database connection. Set ALLOW_START_WITHOUT_DB=false to enforce DB startup checks."
      );
      startHttpServer();
      return;
    }

    process.exit(1);
  })
  .catch((err) => {
    console.error("Unexpected MongoDB startup error:", err);
    process.exit(1);
  });

module.exports = app;
