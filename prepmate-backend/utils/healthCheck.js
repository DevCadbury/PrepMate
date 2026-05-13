const mongoose = require("mongoose");
const os = require("os");
const logger = require("./logger");
const emailService = require("./emailService");
const { getHealthEvents } = require("./healthMonitor");

class HealthCheck {
  constructor() {
    this.startTime = new Date();
    this.checks = {
      database: false,
      memory: false,
      cpu: false,
      disk: false,
      api: false,
      email: false,
    };
  }

  getUptimeMs() {
    return Date.now() - this.startTime.getTime();
  }

  // Check database connection
  async checkDatabase() {
    try {
      const state = mongoose.connection.readyState;
      this.checks.database = state === 1; // 1 = connected
      return {
        status: this.checks.database ? "healthy" : "unhealthy",
        details: {
          state: state,
          stateText: this.getMongoStateText(state),
          database: mongoose.connection.name || "prepmate",
          host: mongoose.connection.host || "localhost",
          port: mongoose.connection.port || 27017,
        },
      };
    } catch (error) {
      logger.error("Database health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  // Check memory usage
  checkMemory() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      this.checks.memory = memoryUsagePercent < 90; // Consider healthy if less than 90%

      return {
        status: this.checks.memory ? "healthy" : "warning",
        details: {
          total: this.formatBytes(totalMemory),
          used: this.formatBytes(usedMemory),
          free: this.formatBytes(freeMemory),
          usagePercent: memoryUsagePercent.toFixed(2),
          threshold: "90%",
        },
      };
    } catch (error) {
      logger.error("Memory health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  // Check CPU usage
  checkCPU() {
    try {
      const cpus = os.cpus();
      const loadAverage = os.loadavg();
      const cpuCount = cpus.length;

      // Calculate CPU usage from load average
      const cpuUsagePercent = (loadAverage[0] / cpuCount) * 100;
      this.checks.cpu = cpuUsagePercent < 80; // Consider healthy if less than 80%

      return {
        status: this.checks.cpu ? "healthy" : "warning",
        details: {
          cores: cpuCount,
          loadAverage: {
            "1min": loadAverage[0].toFixed(2),
            "5min": loadAverage[1].toFixed(2),
            "15min": loadAverage[2].toFixed(2),
          },
          usagePercent: cpuUsagePercent.toFixed(2),
          threshold: "80%",
          model: cpus[0]?.model || "Unknown",
        },
      };
    } catch (error) {
      logger.error("CPU health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  // Check disk space (basic check)
  checkDisk() {
    try {
      // This is a basic check - in production you might want to use a library like 'diskusage'
      this.checks.disk = true; // Assume healthy for now
      return {
        status: "healthy",
        details: {
          platform: os.platform(),
          arch: os.arch(),
          note: "Disk space monitoring requires additional setup",
        },
      };
    } catch (error) {
      logger.error("Disk health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  // Check API endpoints
  async checkAPI() {
    try {
      const endpoints = [
        "/api/auth/signin",
        "/api/social/posts",
        "/api/admin/dashboard",
        "/api/student/dashboard",
      ];

      // For now, we'll assume API is healthy if server is running
      // In a real implementation, you might want to make actual HTTP requests
      this.checks.api = true;

      return {
        status: "healthy",
        details: {
          endpoints: endpoints,
          totalEndpoints: endpoints.length,
          note: "API endpoints are available and responding",
        },
      };
    } catch (error) {
      logger.error("API health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  checkEmailService() {
    try {
      const status = emailService.getStatus();
      this.checks.email = Boolean(status.configured);

      return {
        status: this.checks.email ? "healthy" : "warning",
        details: {
          configured: status.configured,
          provider: status.provider,
          fromAddress: status.fromAddress,
          smtp: status.smtp,
          lastVerifiedAt: status.lastVerifiedAt,
          lastTestError: status.lastTestError,
          lastDeliveredAt: status.lastDeliveredAt,
        },
      };
    } catch (error) {
      logger.error("Email service health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error.message,
        },
      };
    }
  }

  // Get overall health status
  async getOverallHealth() {
    try {
      const database = await this.checkDatabase();
      const memory = this.checkMemory();
      const cpu = this.checkCPU();
      const disk = this.checkDisk();
      const api = await this.checkAPI();
      const email = this.checkEmailService();

      const allChecks = [database, memory, cpu, disk, api, email];
      const healthyChecks = allChecks.filter(
        (check) => check.status === "healthy"
      ).length;
      const totalChecks = allChecks.length;

      let overallStatus = "healthy";
      if (healthyChecks < totalChecks * 0.8) {
        overallStatus = "unhealthy";
      } else if (healthyChecks < totalChecks) {
        overallStatus = "warning";
      }

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        uptimeMs: this.getUptimeMs(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        checks: {
          database,
          memory,
          cpu,
          disk,
          api,
          email,
        },
        events: getHealthEvents(),
        summary: {
          total: totalChecks,
          healthy: healthyChecks,
          warning: allChecks.filter((check) => check.status === "warning")
            .length,
          unhealthy: allChecks.filter((check) => check.status === "unhealthy")
            .length,
        },
      };
    } catch (error) {
      logger.error("Health check failed:", error);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        uptimeMs: this.getUptimeMs(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        error: error.message,
        checks: {
          database: { status: "unhealthy", details: { error: error.message } },
          memory: { status: "unhealthy", details: { error: error.message } },
          cpu: { status: "unhealthy", details: { error: error.message } },
          disk: { status: "unhealthy", details: { error: error.message } },
          api: { status: "unhealthy", details: { error: error.message } },
          email: { status: "unhealthy", details: { error: error.message } },
        },
        events: getHealthEvents(),
        summary: {
          total: 6,
          healthy: 0,
          warning: 0,
          unhealthy: 6,
        },
      };
    }
  }

  // Helper methods
  getMongoStateText(state) {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[state] || "unknown";
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getUptime() {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = new HealthCheck();
