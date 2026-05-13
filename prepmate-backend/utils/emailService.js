const nodemailer = require("nodemailer");
const logger = require("./logger");
const { getEmailConfig, validateEmailConfig } = require("./emailConfig");
const {
  buildVerificationEmailTemplate,
  buildVerificationEmailWithOtp,
  buildResendVerificationEmailTemplate,
  buildLoginWarningEmailTemplate,
  buildPasswordResetEmailTemplate,
  buildWelcomeEmailTemplate,
} = require("./emailTemplates");
const { getFrontendBaseUrl } = require("./urlConfig");
const { recordHealthEvent } = require("./healthMonitor");

class EmailService {
  constructor() {
    this.smtpConfig = getEmailConfig();
    this.validation = validateEmailConfig(this.smtpConfig);
    this.emailEnabled = false;
    this.transportName = "jsonTransport";
    this.lastVerifiedAt = null;
    this.lastTestError = null;
    this.lastDeliveredAt = null;
    this.transporter = this.createTransporter();
  }

  getFromAddress() {
    const fromName = this.smtpConfig.fromName || this.smtpConfig.defaults.fromName;
    const fromEmail = this.smtpConfig.fromEmail || this.smtpConfig.defaults.fromEmail;
    return `"${fromName}" <${fromEmail}>`;
  }

  createTransporter() {
    if (this.smtpConfig.configured && this.validation.valid) {
      this.emailEnabled = true;
      this.transportName = this.smtpConfig.provider || "smtp";

      logger.info(
        `Email transport configured from environment (${this.transportName})`
      );

      return nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        auth: {
          user: this.smtpConfig.user,
          pass: this.smtpConfig.pass,
        },
      });
    }

    logger.warn(
      "Email transport is not fully configured. Using jsonTransport for development."
    );

    return nodemailer.createTransport({ jsonTransport: true });
  }

  getStatus() {
    return {
      configured: this.emailEnabled,
      provider: this.transportName,
      fromAddress: this.getFromAddress(),
      smtp: {
        host: this.smtpConfig.host || null,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        user: this.smtpConfig.user || null,
        valid: this.validation.valid,
        errors: this.validation.errors,
      },
      lastVerifiedAt: this.lastVerifiedAt,
      lastTestError: this.lastTestError,
      lastDeliveredAt: this.lastDeliveredAt,
    };
  }

  async testConnection() {
    if (!this.emailEnabled || typeof this.transporter.verify !== "function") {
      return {
        ok: false,
        reason: "SMTP transport is not configured",
      };
    }

    try {
      await this.transporter.verify();
      this.lastVerifiedAt = new Date().toISOString();
      this.lastTestError = null;

      recordHealthEvent(
        "smtp",
        "SMTP connection verified successfully",
        { provider: this.transportName, fromAddress: this.getFromAddress() },
        "success"
      );

      return {
        ok: true,
        provider: this.transportName,
        verifiedAt: this.lastVerifiedAt,
      };
    } catch (error) {
      this.lastTestError = error.message;
      recordHealthEvent(
        "smtp",
        "SMTP connection verification failed",
        { error: error.message, provider: this.transportName },
        "error"
      );

      return {
        ok: false,
        reason: error.message,
      };
    }
  }

  async deliver(mailOptions, contextLabel) {
    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.lastDeliveredAt = new Date().toISOString();

      recordHealthEvent(
        "email",
        `${contextLabel} sent successfully`,
        {
          to: Array.isArray(mailOptions.to) ? mailOptions.to.length : 1,
          subject: mailOptions.subject,
          provider: this.transportName,
        },
        "success"
      );

      logger.info(`${contextLabel} sent via ${this.transportName}`);
      return result;
    } catch (error) {
      recordHealthEvent(
        "email",
        `${contextLabel} failed`,
        {
          subject: mailOptions.subject,
          provider: this.transportName,
          error: error.message,
        },
        "error"
      );

      logger.error(`Error sending ${contextLabel}:`, error);

      if (process.env.NODE_ENV !== "production") {
        logger.warn(
          `${contextLabel} delivery failed in non-production. Continuing without throwing.`
        );
        return { skipped: true, reason: error.message };
      }

      throw new Error(`Failed to send ${contextLabel}`);
    }
  }

  async sendVerificationEmail(email, token, meta = {}) {
    // Prefer sending the user to the frontend verify page so the frontend handles verification flow
    const frontendBase = getFrontendBaseUrl();
    const verificationUrl = `${frontendBase}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const html = buildVerificationEmailTemplate({
      verificationUrl,
      name: meta.name || "",
      expiryHours: meta.expiryHours || 24,
    });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Verify Your iPrepmate Account",
        html,
      },
      "verification email"
    );
  }

  async sendVerificationWithOtp(email, token, otp, meta = {}) {
    const frontendBase = getFrontendBaseUrl();
    const verificationUrl = `${frontendBase}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const html = buildVerificationEmailWithOtp({
      verificationUrl,
      otp,
      name: meta.name || "",
      expiryHours: meta.expiryHours || 24,
    });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Verify Your iPrepmate Account",
        html,
      },
      "verification email (with OTP)"
    );
  }

  async sendResendVerificationEmail(email, token, meta = {}) {
    const frontendBase = getFrontendBaseUrl();
    const verificationUrl = `${frontendBase}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const html = buildResendVerificationEmailTemplate({
      verificationUrl,
      name: meta.name || "",
      expiryHours: meta.expiryHours || 24,
    });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Resend Your iPrepmate Verification Link",
        html,
      },
      "resend verification email"
    );
  }

  async sendLoginWarningEmail(email, meta = {}) {
    const frontendBase = getFrontendBaseUrl();
    const verificationUrl = `${frontendBase}/verify-email?token=${encodeURIComponent(meta.token || "")}&email=${encodeURIComponent(email)}`;
    const html = buildLoginWarningEmailTemplate({
      name: meta.name || "",
      loginTime: meta.loginTime || new Date().toLocaleString(),
      verificationUrl,
    });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Verify Your iPrepmate Account Before Signing In",
        html,
      },
      "login warning email"
    );
  }

  async sendPasswordResetEmail(email, token, meta = {}) {
    const resetUrl = `${getFrontendBaseUrl()}/reset-password/${token}`;
    const html = buildPasswordResetEmailTemplate({
      resetUrl,
      name: meta.name || "",
      expiryMinutes: meta.expiryMinutes || 10,
    });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Reset Your iPrepmate Password",
        html,
      },
      "password reset email"
    );
  }

  async sendWelcomeEmail(email, name) {
    const html = buildWelcomeEmailTemplate({ name });

    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject: "Welcome to iPrepmate",
        html,
      },
      "welcome email"
    );
  }

  async sendNotificationEmail(email, subject, content) {
    return this.deliver(
      {
        from: this.getFromAddress(),
        to: email,
        subject,
        html: content,
      },
      "notification email"
    );
  }
}

module.exports = new EmailService();
