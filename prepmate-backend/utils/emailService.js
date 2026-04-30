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
    const fromName = process.env.SMTP_FROM_NAME || process.env.SENDGRID_FROM_NAME || "iPrepmate";
    const fromEmail =
      process.env.SMTP_FROM_EMAIL ||
      process.env.SMTP_USER ||
      process.env.SENDGRID_FROM_EMAIL ||
      process.env.GMAIL_USER ||
      "noreply@iprepmate.local";

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
      subject: "Verify Your iPrepmate Account",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a3a52; margin-bottom: 20px; font-size: 24px;">Welcome to iPrepmate</h2>
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Thank you for creating your iPrepmate account. To get started, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Verify Email Address</a>
            </div>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">Or copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; word-break: break-all; margin-bottom: 20px;">${verificationUrl}</p>
            <p style="color: #999; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">This link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
          </div>
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
      subject: "Reset Your iPrepmate Password",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a3a52; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">We received a request to reset the password for your iPrepmate account. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">Or copy and paste this link into your browser:</p>
            <p style="color: #ef4444; word-break: break-all; margin-bottom: 20px;">${resetUrl}</p>
            <p style="color: #999; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">This link will expire in 10 minutes. If you did not request a password reset, please ignore this email. Your account remains secure.</p>
          </div>
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
        subject: "Welcome to iPrepmate",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1a3a52; margin-bottom: 20px; font-size: 24px;">Welcome to iPrepmate</h2>
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">Hello ${name},</p>
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">Thank you for joining iPrepmate. We are committed to helping you prepare effectively for your interviews and career goals.</p>
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">Here are some recommended next steps:</p>
              <ul style="color: #333; line-height: 1.8; margin-bottom: 20px; padding-left: 20px;">
                <li>Complete your profile information</li>
                <li>Explore our comprehensive learning resources</li>
                <li>Take a mock interview to practice</li>
                <li>Connect with our community</li>
              </ul>
              <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Should you need assistance or have questions, our support team is here to help.</p>
              <p style="color: #999; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">Best regards,<br/>The iPrepmate Team</p>
            </div>
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
