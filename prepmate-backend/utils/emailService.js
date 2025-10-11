const nodemailer = require("nodemailer");
const logger = require("./logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDGRID_FROM_EMAIL,
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Send verification email
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

      const mailOptions = {
        from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`,
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

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

      const mailOptions = {
        from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`,
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

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`,
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

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error("Error sending welcome email:", error);
      throw new Error("Failed to send welcome email");
    }
  }

  // Send notification email
  async sendNotificationEmail(email, subject, content) {
    try {
      const mailOptions = {
        from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`,
        to: email,
        subject: subject,
        html: content,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Notification email sent to ${email}`);
    } catch (error) {
      logger.error("Error sending notification email:", error);
      throw new Error("Failed to send notification email");
    }
  }
}

module.exports = new EmailService();
