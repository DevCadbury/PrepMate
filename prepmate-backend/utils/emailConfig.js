const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const parsePort = (value, fallback = 587) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeHost = (value) => String(value || "").trim();

const normalizeEmailAddress = (value) => String(value || "").trim();

const getEmailConfig = () => {
  const host = normalizeHost(process.env.SMTP_HOST);
  const port = parsePort(process.env.SMTP_PORT, 587);
  const secure = parseBoolean(process.env.SMTP_SECURE, false);
  const user = normalizeEmailAddress(process.env.SMTP_USER);
  const pass = String(process.env.SMTP_PASS || "").trim();
  const fromName = String(process.env.SMTP_FROM_NAME || "iPrepmate").trim() || "iPrepmate";
  const fromEmail = normalizeEmailAddress(
    process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ""
  );

  const provider = String(process.env.SMTP_PROVIDER || "gmail").trim().toLowerCase();

  const configured = Boolean(host && user && pass);

  return {
    configured,
    provider,
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    defaults: {
      fromName: "iPrepmate",
      fromEmail: "noreply@iprepmate.local",
    },
  };
};

const validateEmailConfig = (config) => {
  const errors = [];

  if (!config.host) {
    errors.push("SMTP_HOST is required");
  }

  if (!config.user) {
    errors.push("SMTP_USER is required");
  }

  if (!config.pass) {
    errors.push("SMTP_PASS is required");
  }

  if (config.port < 1 || config.port > 65535) {
    errors.push("SMTP_PORT must be a valid port number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  getEmailConfig,
  validateEmailConfig,
  parseBoolean,
  parsePort,
};