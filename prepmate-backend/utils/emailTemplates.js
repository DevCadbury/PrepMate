const createShell = ({ title, accent = "#1d4ed8", body }) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f5f7fb; margin:0; padding:24px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <div style="padding:28px 32px; background:linear-gradient(135deg, ${accent}, #0f172a); color:#ffffff;">
        <div style="font-size:14px; letter-spacing:.12em; text-transform:uppercase; opacity:.9; margin-bottom:8px;">iPrepmate</div>
        <h1 style="margin:0; font-size:28px; line-height:1.2;">${title}</h1>
      </div>
      <div style="padding:32px;">${body}</div>
      <div style="padding:20px 32px 28px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:13px; line-height:1.6;">
        This message was sent by iPrepmate. If you did not request this email, you can safely ignore it.
      </div>
    </div>
  </div>
`;

const buttonStyle = (accent = "#1d4ed8") => `display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;`;

const buildVerificationEmailTemplate = ({ verificationUrl, name, expiryHours = 24 }) =>
  createShell({
    title: "Verify Your Email Address",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">Your account has been created successfully. Please verify your email address to unlock sign-in and secure access to iPrepmate.</p>
      <p style="margin:0 0 24px; text-align:center;"><a href="${verificationUrl}" style="${buttonStyle()}">Verify Email</a></p>
      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#4b5563;">If the button does not work, paste this link into your browser:</p>
      <p style="margin:0 0 16px; word-break:break-all; font-size:14px; line-height:1.6; color:#1d4ed8;">${verificationUrl}</p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">This verification link expires in ${expiryHours} hours.</p>
    `,
  });

const buildVerificationEmailWithOtp = ({ verificationUrl, otp, name, expiryHours = 24 }) =>
  createShell({
    title: "Verify Your Email Address",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">Your account has been created successfully. You can either click the verification link below or use the one-time code to verify your email.</p>
      <p style="margin:0 0 12px; text-align:center;"><a href="${verificationUrl}" style="${buttonStyle()}">Verify Email</a></p>
      <p style="margin:0 0 20px; text-align:center; font-size:18px; font-weight:700; letter-spacing:2px;">One-time code: ${otp}</p>
      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#4b5563;">If the button does not work, paste this link into your browser:</p>
      <p style="margin:0 0 16px; word-break:break-all; font-size:14px; line-height:1.6; color:#1d4ed8;">${verificationUrl}</p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">This verification link and code expire in ${expiryHours} hours.</p>
    `,
  });

const buildResendVerificationEmailTemplate = ({ verificationUrl, name, expiryHours = 24 }) =>
  createShell({
    title: "Resend Verification Link",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">We received a request to resend your verification link. Use the button below to verify your email address and continue with iPrepmate.</p>
      <p style="margin:0 0 24px; text-align:center;"><a href="${verificationUrl}" style="${buttonStyle()}">Verify Email Now</a></p>
      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#4b5563;">If the button does not work, paste this link into your browser:</p>
      <p style="margin:0 0 16px; word-break:break-all; font-size:14px; line-height:1.6; color:#1d4ed8;">${verificationUrl}</p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">This verification link expires in ${expiryHours} hours.</p>
    `,
  });

const buildLoginWarningEmailTemplate = ({ name, loginTime, verificationUrl }) =>
  createShell({
    title: "Verify Your Account to Sign In",
    accent: "#b45309",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">We detected a sign-in attempt for your account at ${loginTime || "this time"}, but your email address is still unverified.</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">Please verify your email address first, then sign in again.</p>
      <p style="margin:0 0 24px; text-align:center;"><a href="${verificationUrl}" style="${buttonStyle("#b45309")}">Verify Email</a></p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">If you did not try to sign in, no further action is required.</p>
    `,
  });

const buildPasswordResetEmailTemplate = ({ resetUrl, name, expiryMinutes = 10 }) =>
  createShell({
    title: "Reset Your Password",
    accent: "#dc2626",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 20px; font-size:16px; line-height:1.7; color:#374151;">We received a request to reset your iPrepmate password. Use the link below to set a new password.</p>
      <p style="margin:0 0 24px; text-align:center;"><a href="${resetUrl}" style="${buttonStyle("#dc2626")}">Reset Password</a></p>
      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#4b5563;">If the button does not work, paste this link into your browser:</p>
      <p style="margin:0 0 16px; word-break:break-all; font-size:14px; line-height:1.6; color:#dc2626;">${resetUrl}</p>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">This reset link expires in ${expiryMinutes} minutes.</p>
    `,
  });

const buildWelcomeEmailTemplate = ({ name }) =>
  createShell({
    title: "Welcome to iPrepmate",
    body: `
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 16px; font-size:16px; line-height:1.7; color:#374151;">Thank you for joining iPrepmate. We are glad to have you on the platform.</p>
      <ul style="margin:0 0 20px; padding-left:20px; color:#374151; line-height:1.8;">
        <li>Complete your profile</li>
        <li>Verify your email address</li>
        <li>Explore interview preparation tools</li>
        <li>Start practicing with real-time features</li>
      </ul>
      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">If you have any questions, please contact the iPrepmate support team.</p>
    `,
  });

module.exports = {
  buildVerificationEmailTemplate,
  buildVerificationEmailWithOtp,
  buildResendVerificationEmailTemplate,
  buildLoginWarningEmailTemplate,
  buildPasswordResetEmailTemplate,
  buildWelcomeEmailTemplate,
};