const express = require("express");
const router = express.Router();
const healthCheck = require("../utils/healthCheck");
const logger = require("../utils/logger");
const emailService = require("../utils/emailService");

const serverStartedAt = new Date();

const formatUptime = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds: secs,
    label: `${days}d ${hours}h ${minutes}m ${secs}s`,
  };
};

// Basic health check
router.get("/", async (req, res) => {
  try {
    const health = await healthCheck.getOverallHealth();

    // Set appropriate status code based on health
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "warning"
        ? 200
        : 503;

    res.status(statusCode).json({
      success: true,
      message: "iPrepmate API Health Check",
      service: "iPrepmate backend",
      status: health.status,
      timestamp: health.timestamp,
      environment: health.environment,
      uptime: health.uptime,
      uptimeMs: health.uptimeMs,
      dependencies: {
        database: health.checks.database,
        email: health.checks.email,
        verification: {
          enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
          configured: emailService.getStatus().configured,
        },
      },
      data: health,
    });
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(503).json({
      success: false,
      message: "Health check failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// Ping endpoint for monitoring and optional keep-alive
router.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "pong",
    service: "iPrepmate backend",
    timestamp: new Date().toISOString(),
    uptime: healthCheck.getUptime(),
  });
});

// Detailed health check with specific components
router.get("/detailed", async (req, res) => {
  try {
    const database = await healthCheck.checkDatabase();
    const memory = healthCheck.checkMemory();
    const cpu = healthCheck.checkCPU();
    const disk = healthCheck.checkDisk();
    const api = await healthCheck.checkAPI();

    const detailedHealth = {
      timestamp: new Date().toISOString(),
      uptime: healthCheck.getUptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      components: {
        database,
        memory,
        cpu,
        disk,
        api,
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
      },
    };

    res.json({
      success: true,
      message: "Detailed Health Check",
      data: detailedHealth,
    });
  } catch (error) {
    logger.error("Detailed health check error:", error);
    res.status(503).json({
      success: false,
      message: "Detailed health check failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// Database health check only
router.get("/database", async (req, res) => {
  try {
    const databaseHealth = await healthCheck.checkDatabase();

    const statusCode = databaseHealth.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      message: "Database Health Check",
      data: databaseHealth,
    });
  } catch (error) {
    logger.error("Database health check error:", error);
    res.status(503).json({
      success: false,
      message: "Database health check failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// System resources health check
router.get("/system", async (req, res) => {
  try {
    const memory = healthCheck.checkMemory();
    const cpu = healthCheck.checkCPU();
    const disk = healthCheck.checkDisk();

    const systemHealth = {
      timestamp: new Date().toISOString(),
      memory,
      cpu,
      disk,
    };

    res.json({
      success: true,
      message: "System Resources Health Check",
      data: systemHealth,
    });
  } catch (error) {
    logger.error("System health check error:", error);
    res.status(503).json({
      success: false,
      message: "System health check failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// API endpoints health check
router.get("/api", async (req, res) => {
  try {
    const apiHealth = await healthCheck.checkAPI();

    res.json({
      success: true,
      message: "API Endpoints Health Check",
      data: apiHealth,
    });
  } catch (error) {
    logger.error("API health check error:", error);
    res.status(503).json({
      success: false,
      message: "API health check failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// Readiness probe for Kubernetes/container orchestration
router.get("/ready", async (req, res) => {
  try {
    const health = await healthCheck.getOverallHealth();

    if (health.status === "healthy") {
      res.status(200).json({
        success: true,
        message: "Service is ready",
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        message: "Service is not ready",
        status: "not_ready",
        timestamp: new Date().toISOString(),
        issues: Object.entries(health.checks)
          .filter(([_, check]) => check.status !== "healthy")
          .map(([name, check]) => ({ component: name, status: check.status })),
      });
    }
  } catch (error) {
    logger.error("Readiness probe error:", error);
    res.status(503).json({
      success: false,
      message: "Service is not ready",
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal error",
    });
  }
});

// Liveness probe for Kubernetes/container orchestration
router.get("/live", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service is alive",
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: healthCheck.getUptime(),
  });
});

// Uptime summary endpoint (for keep-alive + status dashboards)
router.get("/uptime", (req, res) => {
  const uptimeSeconds = process.uptime();
  const formatted = formatUptime(uptimeSeconds);

  res.json({
    success: true,
    message: "Service uptime",
    data: {
      uptimeSeconds,
      uptime: formatted,
      startedAt: serverStartedAt.toISOString(),
      lastReboot: serverStartedAt.toISOString(),
      now: new Date().toISOString(),
    },
  });
});

// SMTP smoke test endpoint for administrators and monitoring.
router.post("/smtp/test", async (req, res) => {
  try {
    const result = await emailService.testConnection();
    const statusCode = result.ok ? 200 : 503;

    res.status(statusCode).json({
      success: result.ok,
      message: result.ok ? "SMTP connection verified" : "SMTP verification failed",
      data: result,
    });
  } catch (error) {
    logger.error("SMTP smoke test error:", error);
    res.status(503).json({
      success: false,
      message: "SMTP smoke test failed",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Internal error",
    });
  }
});

module.exports = router;
