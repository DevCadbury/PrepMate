const mongoose = require("mongoose");
const crypto = require("crypto");

const pendingSignupSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      index: true,
    },
    hashedPassword: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    hashedOTP: {
      type: String,
    },
    verificationToken: {
      type: String,
      required: [true, "Verification token is required"],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResendAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    lastVerificationAttemptAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired records
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups by email
pendingSignupSchema.index({ email: 1 });

// Index for verification token lookups
pendingSignupSchema.index({ verificationToken: 1 });

// Method to generate a 6-digit OTP
pendingSignupSchema.methods.generateOTP = function (digits = 6, expiresMinutes = 10) {
  const max = Math.pow(10, digits) - 1;
  const min = Math.pow(10, digits - 1);
  const otpPlain = String(Math.floor(Math.random() * (max - min + 1)) + min);
  this.hashedOTP = crypto.createHash("sha256").update(otpPlain).digest("hex");
  this.otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  this.verificationAttempts = 0;
  return otpPlain;
};

// Method to generate verification token
pendingSignupSchema.methods.generateVerificationToken = function (expiresHours = 24) {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
  return token;
};

// Method to verify OTP
pendingSignupSchema.methods.verifyOTP = function (otp) {
  const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
  
  // Debug logging in development
  if (process.env.NODE_ENV !== "production") {
    console.log("=== OTP VERIFICATION DEBUG ===");
    console.log("Input OTP:", otp);
    console.log("Hashed input:", hashedInput);
    console.log("Stored hash:", this.hashedOTP);
    console.log("Match:", hashedInput === this.hashedOTP);
    console.log("Expires at:", this.otpExpiresAt);
    console.log("Now:", new Date());
  }
  
  // Check if OTP has expired
  if (Date.now() > this.otpExpiresAt.getTime()) {
    return { valid: false, reason: "expired" };
  }
  
  // Check if OTP matches
  if (hashedInput !== this.hashedOTP) {
    return { valid: false, reason: "invalid" };
  }
  
  return { valid: true };
};

// Method to verify token
pendingSignupSchema.methods.verifyToken = function (token) {
  const hashedInput = crypto.createHash("sha256").update(token).digest("hex");
  
  // Check if token has expired
  if (Date.now() > this.expiresAt.getTime()) {
    return { valid: false, reason: "expired" };
  }
  
  // Check if token matches
  if (hashedInput !== this.verificationToken) {
    return { valid: false, reason: "invalid" };
  }
  
  return { valid: true };
};

// Method to mark as verified
pendingSignupSchema.methods.markVerified = function () {
  this.isVerified = true;
  this.verifiedAt = new Date();
  this.hashedOTP = undefined; // Clear OTP after verification
};

// Method to track verification attempt
pendingSignupSchema.methods.recordVerificationAttempt = function () {
  this.verificationAttempts += 1;
  this.lastVerificationAttemptAt = new Date();
};

// Method to track resend
pendingSignupSchema.methods.recordResend = function () {
  this.resendCount += 1;
  this.lastResendAt = new Date();
  this.verificationAttempts = 0; // Reset attempts on resend
};

// Static method to find by email
pendingSignupSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isVerified: false });
};

// Static method to find by verification token
pendingSignupSchema.statics.findByToken = function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return this.findOne({ verificationToken: hashedToken, isVerified: false });
};

// Static method to cleanup expired records
pendingSignupSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
    isVerified: false,
  });
  return result.deletedCount;
};

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
