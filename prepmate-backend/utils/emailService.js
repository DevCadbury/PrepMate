const nodemailer = require("nodemailer");
const logger = require("./logger");

class EmailService {
  constructor() {
    this.emailEnabled = false;
    this.transportName = "jsonTransport";
    this.transporter = this.createTransporter();
  }

  isConfigured(value, placeholderPattern) {
    if (!value) return false;
    if (!placeholderPattern) return true;
    return !placeholderPattern.test(String(value));
  }

  createTransporter() {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    const hasRealSendgridKey =
      this.isConfigured(sendgridApiKey, /^your-sendgrid-api-key$/i) &&
      String(sendgridApiKey).startsWith("SG.");
    const hasSmtpConfig =
      this.isConfigured(smtpHost) &&
      this.isConfigured(smtpUser) &&
      this.isConfigured(smtpPass);
    const hasGmailConfig =
      this.isConfigured(gmailUser) && this.isConfigured(gmailAppPassword);

    if (hasRealSendgridKey) {
      this.emailEnabled = true;
      this.transportName = "sendgrid";
      logger.info("Email transport configured with SendGrid SMTP");
      return nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: sendgridApiKey,
        },
      });
    }

    if (hasSmtpConfig) {
      this.emailEnabled = true;
      this.transportName = "smtp";
      logger.info("Email transport configured with custom SMTP");
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    if (hasGmailConfig) {
      this.emailEnabled = true;
      this.transportName = "gmail";
      logger.info("Email transport configured with Gmail");
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
    }

    logger.warn(
      "Email transport is not fully configured. Falling back to jsonTransport for development."
    );
    return nodemailer.createTransport({ jsonTransport: true });
  }

  getFromAddress() {
    const fromName = process.env.SENDGRID_FROM_NAME || "PrepMate";
    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL ||
      process.env.SMTP_FROM_EMAIL ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      "noreply@prepmate.local";

    return `"${fromName}" <${fromEmail}>`;
  }

  async deliver(mailOptions, contextLabel) {
    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`${contextLabel} sent via ${this.transportName}`);
      return result;
    } catch (error) {
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

  // Send verification email
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

    const mailOptions = {
      from: this.getFromAddress(),
      to: email,
      subject: "Verify Your PrepMate Account",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to PrepMate!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        `,
    };

    await this.deliver(mailOptions, "verification email");
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: this.getFromAddress(),
      to: email,
      subject: "Reset Your PrepMate Password",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your PrepMate account. Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          </div>
        `,
    };

    await this.deliver(mailOptions, "password reset email");
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: this.getFromAddress(),
        to: email,
        subject: "Welcome to PrepMate!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to PrepMate, ${name}!</h2>
            <p>We're excited to have you on board. Here's what you can do to get started:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Explore our learning roadmaps</li>
              <li>Try your first AI-powered mock interview</li>
              <li>Join the community</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy learning!</p>
          </div>
        `,
      };

      await this.deliver(mailOptions, "welcome email");
    } catch (error) {
      logger.error("Error sending welcome email:", error);
      throw new Error("Failed to send welcome email");
    }
  }

  // Send notification email
  async sendNotificationEmail(email, subject, content) {
    try {
      const mailOptions = {
        from: this.getFromAddress(),
        to: email,
        subject: subject,
        html: content,
      };

      await this.deliver(mailOptions, "notification email");
    } catch (error) {
      logger.error("Error sending notification email:", error);
      throw new Error("Failed to send notification email");
    }
  }
}

module.exports = new EmailService();
