const express = require("express");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PendingSignup = require("../models/PendingSignup");
const emailService = require("../utils/emailService");
const { generateToken, verifyToken } = require("../utils/jwtUtils");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const { uploadBuffer, isCloudinaryConfigured } = require("../utils/cloudinary");
const { processImageBuffer } = require("../utils/imageProcessing");
const { getFrontendBaseUrl, getBackendBaseUrl } = require("../utils/urlConfig");
const {
  blacklistToken,
  getBlacklistStats,
} = require("../utils/tokenBlacklist");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const onboardingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image uploads are supported"));
    }
    return cb(null, true);
  },
});

// Simple in-memory resend tracker per email. Structure:
// { count: number, firstRequestAt: timestamp, lastSentAt: timestamp }
// Limits: maxResendsPerWindow per windowMs, and minIntervalBetweenSends (ms)
const emailResendTracker = new Map();
const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RESENDS_PER_WINDOW = Number(process.env.RESEND_MAX_PER_DAY) || 5;
const MIN_RESEND_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes between resends

// IP-level rate limiter for resend endpoint (protects abuse)
const resendIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 requests per IP per hour
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// Rate limiting configuration for signup flow
const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per IP per hour
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Temporary storage for Google OAuth data (in production, use Redis or similar)
const googleDataStore = new Map();

const normalizedBaseUrl = getBackendBaseUrl() || "http://localhost:5000";
const defaultGoogleCallbackUrl = `${normalizedBaseUrl}/api/auth/google/callback`;
const defaultGoogleAdminCallbackUrl = `${normalizedBaseUrl}/api/auth/admin/google/callback`;

// Helper function to safely update user with retry logic
const safeUserUpdate = async (user, updates) => {
  try {
    // Use findOneAndUpdate for atomic updates to avoid parallel save conflicts
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        ...updates,
        lastSeen: new Date(),
        isOnline: true,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (error) {
    // Fallback to save method if findOneAndUpdate fails
    try {
      Object.assign(user, updates);
      user.updateLastSeen();
      await user.save();
      return user;
    } catch (saveError) {
      if (saveError.name === "ParallelSaveError") {
        // Retry with fresh document
        const freshUser = await User.findById(user._id);
        if (freshUser) {
          Object.assign(freshUser, updates);
          freshUser.updateLastSeen();
          await freshUser.save();
          return freshUser;
        }
      }
      throw saveError;
    }
  }
};

// Helper function for atomic social operations
const safeSocialOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === "ParallelSaveError") {
      // For social operations, we need to retry with fresh documents
      // This is handled in the individual model methods
      throw error;
    }
    throw error;
  }
};

const buildOnboardingPayload = (user) => {
  if (!user) return null;

  if (user.isProfileComplete) {
    return {
      status: "complete",
      step: "complete",
      source: user.onboarding?.source || "unknown",
      profileDraft: user.onboarding?.profileDraft || {},
      usernameDraft: user.onboarding?.usernameDraft || "",
      updatedAt: user.onboarding?.updatedAt || user.updatedAt || new Date(),
    };
  }

  return {
    status: user.onboarding?.status || "profile",
    step: user.onboarding?.step || "profile",
    source: user.onboarding?.source || "unknown",
    profileDraft: user.onboarding?.profileDraft || {},
    usernameDraft: user.onboarding?.usernameDraft || "",
    updatedAt: user.onboarding?.updatedAt || user.updatedAt || new Date(),
  };
};

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || defaultGoogleCallbackUrl,
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/user.birthday.read",
        "https://www.googleapis.com/auth/user.gender.read",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("=== GOOGLE OAUTH CALLBACK ===");
        console.log("Profile:", profile);

        const { id, displayName, emails, photos, _json } = profile;
        const email = emails[0]?.value;
        const nameParts = String(displayName || "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ");

        // Extract additional data from Google profile
        const googleData = {
          name: displayName,
          email: email,
          picture: photos?.[0]?.value || "",
          // Extract DOB if available
          dateOfBirth: _json?.birthday || null,
          // Extract gender if available
          gender: _json?.gender || null,
        };

        if (!email) {
          return done(new Error("Email is required from Google OAuth"));
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          console.log("Existing user found:", user.email);

          // Link Google identity to existing email account for unified sign-in.
          if (!user.googleId) {
            user.googleId = id;
          }

          // Update last login
          user.lastLogin = new Date();

          // Update profile picture if not set
          if (!user.profilePicture && photos && photos[0]) {
            user.profilePicture = photos[0].value;
          }

          // Update name if not set
          if (!user.name && displayName) {
            user.name = displayName;
          }

          await user.save();
          return done(null, user);
        }

        // Create new user
        console.log("Creating new user with email:", email);

        // Generate a temporary username from email
        const tempUsername =
          email.split("@")[0] + "_" + Math.random().toString(36).substr(2, 5);

        const newUser = new User({
          email,
          username: tempUsername,
          name: displayName || "Google User",
          profilePicture: photos?.[0]?.value || "",
          googleId: id,
          emailVerified: true,
          isProfileComplete: false, // New users need to complete profile
          onboarding: {
            status: "profile",
            step: "profile",
            source: "google",
            profileDraft: {
              firstName,
              lastName,
              dateOfBirth: _json?.birthday ? new Date(_json.birthday) : undefined,
              profilePicture: photos?.[0]?.value || "",
            },
            usernameDraft: "",
            updatedAt: new Date(),
          },
          lastLogin: new Date(),
        });

        // Store Google data for onboarding
        const googleDataId = crypto.randomBytes(16).toString("hex");
        googleDataStore.set(googleDataId, {
          data: googleData,
          timestamp: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        console.log("✅ Google data stored for onboarding:", googleData);

        await newUser.save();
        console.log("New user created:", newUser.email);

        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth strategy error:", error);
        return done(error);
      }
    }
  )
);

// Configure Google Strategy for Admin
passport.use(
  "google-admin",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "default-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "default-client-secret",
      callbackURL:
        process.env.GOOGLE_ADMIN_CALLBACK_URL || defaultGoogleAdminCallbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists and is an admin
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        });

        if (user) {
          // Check if user is admin
          if (user.role !== "admin") {
            return done(
              new Error("Access denied. Admin privileges required."),
              null
            );
          }

          // Update last login
          user.lastLogin = new Date();
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          await user.save();
          return done(null, user);
        }

        return done(
          new Error("Admin account not found. Please contact administrator."),
          null
        );
      } catch (error) {
        logger.error("Google Admin OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// @desc    Signup user (Updated to use pending signup flow)
// @route   POST /api/auth/signup
// @access  Public
router.post(
  "/signup",
  signupRateLimit,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and number"),
    body("confirmPassword")
      .optional()
      .custom((value, { req }) => {
        if (value && value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists (verified account)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please login.",
        data: null,
      });
    }

    // Check if there's already a pending signup for this email
    let pendingSignup = await PendingSignup.findByEmail(normalizedEmail);
    
    if (pendingSignup) {
      // Check if pending signup has expired
      if (Date.now() > pendingSignup.expiresAt.getTime()) {
        // Delete expired pending signup
        await PendingSignup.deleteOne({ _id: pendingSignup._id });
        pendingSignup = null;
      } else {
        // Check resend cooldown (2 minutes)
        const cooldownMs = 2 * 60 * 1000;
        if (pendingSignup.lastResendAt && 
            Date.now() - pendingSignup.lastResendAt.getTime() < cooldownMs) {
          const remainingSeconds = Math.ceil(
            (cooldownMs - (Date.now() - pendingSignup.lastResendAt.getTime())) / 1000
          );
          return res.status(429).json({
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
            data: {
              retryAfter: remainingSeconds,
              email: normalizedEmail,
              requiresVerification: true,
            },
          });
        }

        // Check max resend limit (5 per day)
        if (pendingSignup.resendCount >= 5) {
          return res.status(429).json({
            success: false,
            message: "Maximum resend attempts reached. Please start a new signup.",
            data: null,
          });
        }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP and verification token
    let plainOTP, plainToken;
    
    if (pendingSignup) {
      // Update existing pending signup
      pendingSignup.hashedPassword = hashedPassword;
      plainOTP = pendingSignup.generateOTP(6, 10);
      plainToken = pendingSignup.generateVerificationToken(24);
      pendingSignup.recordResend();
      pendingSignup.ipAddress = req.ip;
      pendingSignup.userAgent = req.headers["user-agent"];
      await pendingSignup.save();
    } else {
      // Create new pending signup
      pendingSignup = new PendingSignup({
        email: normalizedEmail,
        hashedPassword,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      plainOTP = pendingSignup.generateOTP(6, 10);
      plainToken = pendingSignup.generateVerificationToken(24);
      await pendingSignup.save();
    }

    // Send verification email with OTP
    let emailSent = true;
    try {
      await emailService.sendVerificationWithOtp(
        normalizedEmail,
        plainToken,
        plainOTP,
        { name: normalizedEmail.split("@")[0] }
      );
    } catch (error) {
      emailSent = false;
      logger.error("Failed to send verification email:", error);
    }

    // Prepare response
    const responseData = {
      email: normalizedEmail,
      emailSent,
      requiresVerification: true,
      expiresIn: 600, // 10 minutes in seconds
    };

    // In development, include OTP and token for testing
    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.otpDev = plainOTP;
      responseData.tokenDev = plainToken;
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Signup initiated. Please check your email for the verification code."
        : "Signup initiated but email delivery failed.",
      data: responseData,
    });
  })
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or username is required")
      .custom((value) => {
        // Check if it's an email or username
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(value);

        if (!isEmail && !isUsername) {
          throw new Error("Please enter a valid email or username");
        }
        return true;
      }),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { identifier, password } = req.body;

    // Find user by email or username and include password for comparison
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: null,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
        data: null,
      });
    }

    // Check password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account currently uses Google sign-in. Set a password from Settings to enable email/password login.",
        data: null,
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: null,
      });
    }

    // Block login if email not verified (return verification requirement response)
    if (!user.emailVerified) {
      return res.status(200).json({
        success: false,
        message: "Email verification required",
        data: {
          requiresVerification: true,
          email: user.email,
        },
      });
    }

    // Update last login safely
    const updatedUser = await safeUserUpdate(user, { lastLogin: new Date() });

    // Generate unique JWT token
    const token = updatedUser.generateAuthToken();

    console.log("=== LOGIN SUCCESS ===");
    console.log("User ID:", updatedUser._id);
    console.log("Username:", updatedUser.username);
    console.log("Token generated:", token.substring(0, 50) + "...");
    console.log("Login time:", new Date().toISOString());

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
          isProfileComplete: updatedUser.isProfileComplete,
          profilePicture: updatedUser.profilePicture,
          profile: updatedUser.profile,
          progress: updatedUser.progress,
          metrics: updatedUser.metrics,
          onboarding: buildOnboardingPayload(updatedUser),
        },
        token,
      },
    });
  })
);

// @desc    Google OAuth login
// @route   GET /api/auth/google
// @access  Public
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err || !user) {
      logger.error("Google OAuth callback failed", {
        error: err?.message || err,
        info,
      });
      return res.redirect(`${getFrontendBaseUrl()}/auth/google/error`);
    }

    try {
      console.log("=== GOOGLE OAUTH CALLBACK TRIGGERED ===");
      console.log("Request user:", user);
      console.log("Request body:", req.body);
      console.log("Request query:", req.query);

      console.log("✅ User found:", user.email);
      console.log("User profile complete:", user.isProfileComplete);
      console.log("User username:", user.username);
      console.log("User name:", user.name);

      // Check if user has a username (this is the key requirement)
      const hasUsername = user.username && user.username.trim() !== "";

      console.log("User has username:", hasUsername);
      console.log("User username:", user.username);

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log("JWT token generated");

      // Redirect based on username availability
      if (hasUsername) {
        console.log("🔄 Redirecting to dashboard (user has username)");
        res.redirect(
          `${getFrontendBaseUrl()}/auth/google/success?token=${token}&profileComplete=true`
        );
        return;
      }

      console.log("🔄 Redirecting to onboarding (user needs username)");
      const googleDataId = crypto.randomBytes(16).toString("hex");

      let googleData = null;
      for (const [key, value] of googleDataStore.entries()) {
        if (value.data.email === user.email) {
          googleData = value.data;
          googleDataStore.delete(key);
          break;
        }
      }

      if (!googleData) {
        googleData = {
          name: user.name,
          email: user.email,
          picture: user.profilePicture,
        };
      }

      console.log("Generated Google data ID:", googleDataId);
      console.log("Google data to store:", googleData);

      googleDataStore.set(googleDataId, {
        data: googleData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      console.log("✅ Google data stored successfully");
      console.log("Current store size:", googleDataStore.size);

      const redirectUrl = `${getFrontendBaseUrl()}/auth/google/success?token=${token}&profileComplete=false&googleDataId=${googleDataId}`;

      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      res.redirect(`${getFrontendBaseUrl()}/auth/google/error`);
    }
  })(req, res, next);
});

// @desc    Admin Google OAuth login
// @route   GET /api/auth/admin/google
// @access  Public
router.get(
  "/admin/google",
  passport.authenticate("google-admin", { scope: ["profile", "email"] })
);

// @desc    Admin Google OAuth callback
// @route   GET /api/auth/admin/google/callback
// @access  Public
router.get(
  "/admin/google/callback",
  passport.authenticate("google-admin", { session: false }),
  asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Admin Google authentication failed",
        data: null,
      });
    }

    // Update last login safely
    const updatedUser = await safeUserUpdate(user, { lastLogin: new Date() });

    // Generate JWT token
    const token = updatedUser.generateAuthToken();

    // Redirect to admin frontend with token
    const redirectUrl = `${getFrontendBaseUrl()}/admin/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  })
);

const verifyEmailTokenHandler = async (req, res) => {
  const token = req.params.token || req.query.token;
  if (!token) {
    return res.status(400).json({ success: false, message: "Verification token is required", data: null });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification token", data: null });
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpires = undefined;
  await user.save();

  return res.json({ success: true, message: "Email verified successfully", data: { emailVerified: true } });
};

// @desc    Verify email via token (legacy path)
// @route   GET /api/auth/verify-email/:token
// @access  Public
router.get("/verify-email/:token", asyncHandler(verifyEmailTokenHandler));

// @desc    Verify email via token (query)
// @route   GET /api/auth/verify-email-token?token=...
// @access  Public
router.get("/verify-email-token", asyncHandler(verifyEmailTokenHandler));

const sendVerificationOtpHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("=== RESEND OTP VALIDATION ERRORS ===", errors.array());
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: null,
      errors: errors.array(),
    });
  }

  const email = String(req.body.email).toLowerCase();
  console.log("=== RESEND OTP REQUEST ===");
  console.log("Email:", email);

  // FIRST: Check for pending signup (new flow)
  const pendingSignup = await PendingSignup.findByEmail(email);
  console.log("Pending signup found:", !!pendingSignup);
  if (pendingSignup) {
    console.log("Pending signup expiresAt:", pendingSignup.expiresAt);
    console.log("Pending signup isVerified:", pendingSignup.isVerified);
    // Check if already verified
    if (pendingSignup.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This email has already been verified. Please complete your profile.",
        data: { alreadyVerified: true },
      });
    }

    // Check if expired
    if (Date.now() > pendingSignup.expiresAt.getTime()) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "Verification session has expired. Please start the signup process again.",
        data: { expired: true },
      });
    }

    // Check cooldown (2 minutes)
    const cooldownMs = 2 * 60 * 1000;
    if (pendingSignup.lastResendAt && 
        Date.now() - pendingSignup.lastResendAt.getTime() < cooldownMs) {
      const remainingSeconds = Math.ceil(
        (cooldownMs - (Date.now() - pendingSignup.lastResendAt.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        data: { retryAfter: remainingSeconds },
      });
    }

    // Check max resends
    if (pendingSignup.resendCount >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum resend attempts reached. Please start a new signup.",
        data: null,
      });
    }

    // Generate new OTP and token (invalidate old ones)
    const plainOTP = pendingSignup.generateOTP(6, 10);
    const plainToken = pendingSignup.generateVerificationToken(24);
    pendingSignup.recordResend();
    await pendingSignup.save();

    // Send new verification email
    let emailSent = true;
    try {
      await emailService.sendVerificationWithOtp(
        email,
        plainToken,
        plainOTP,
        { name: email.split("@")[0] }
      );
    } catch (error) {
      emailSent = false;
      logger.error("Failed to resend verification email:", error);
    }

    const responseData = {
      emailSent,
      expiresIn: 600,
    };

    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.otpDev = plainOTP;
      responseData.tokenDev = plainToken;
    }

    return res.json({
      success: true,
      message: emailSent
        ? "New verification code sent. Check your email."
        : "Failed to send verification email.",
      data: responseData,
    });
  }

  // SECOND: Check for legacy user (old flow)
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({
      success: true,
      message: "If an account exists for this email, a verification link and code have been sent.",
      data: { emailSent: true },
    });
  }

  if (user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified",
      data: null,
    });
  }

  const now = Date.now();
  const entry = emailResendTracker.get(email) || {
    count: 0,
    firstRequestAt: now,
    lastSentAt: 0,
  };

  if (now - entry.firstRequestAt > RESEND_WINDOW_MS) {
    entry.count = 0;
    entry.firstRequestAt = now;
    entry.lastSentAt = 0;
  }

  if (now - entry.lastSentAt < MIN_RESEND_INTERVAL_MS) {
    return res.status(429).json({
      success: false,
      message: `Please wait ${Math.ceil((MIN_RESEND_INTERVAL_MS - (now - entry.lastSentAt)) / 1000)} seconds before requesting another verification email.`,
      data: null,
    });
  }

  if (entry.count >= MAX_RESENDS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: "You have reached the maximum number of resend attempts for today. Please try again later or contact support.",
      data: null,
    });
  }

  const verificationToken = user.generateEmailVerificationToken();
  const otp = user.generateEmailVerificationOtp();
  await user.save();

  let emailSent = true;
  try {
    await emailService.sendVerificationWithOtp(user.email, verificationToken, otp, { name: user.name });
  } catch (error) {
    emailSent = false;
    logger.error("Failed to send verification email (with OTP):", error);
  }

  if (emailSent) {
    entry.count += 1;
    entry.lastSentAt = now;
    emailResendTracker.set(email, entry);
  }

  const responseData = { emailSent };
  if (!emailSent && process.env.NODE_ENV !== "production") {
    responseData.verificationToken = verificationToken;
    responseData.otp = otp;
    responseData.verificationUrl = `${getFrontendBaseUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  }

  return res.json({
    success: true,
    message: emailSent
      ? "Verification link and code sent. Check your inbox."
      : "Failed to send verification email.",
    data: responseData,
  });
};

// @desc    Send verification OTP + link
// @route   POST /api/auth/send-verification-otp
// @access  Public
router.post(
  "/send-verification-otp",
  resendIpLimiter,
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")],
  asyncHandler(sendVerificationOtpHandler)
);

// @desc    Resend OTP + link
// @route   POST /api/auth/resend-otp
// @access  Public
router.post(
  "/resend-otp",
  verifyOtpRateLimit,
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")],
  asyncHandler(sendVerificationOtpHandler)
);

// @desc    Verify OTP (supports both new pending signup flow and legacy users)
// @route   POST /api/auth/verify-otp
// @access  Public
router.post(
  "/verify-otp",
  verifyOtpRateLimit,
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("otp").isLength({ min: 4, max: 10 }).trim().withMessage("Please enter a valid verification code"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("=== VERIFY OTP VALIDATION ERRORS ===", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const email = String(req.body.email).toLowerCase();
    const otp = String(req.body.otp).trim();
    
    console.log("=== VERIFY OTP REQUEST ===");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("Body:", req.body);

    // FIRST: Check for pending signup (new flow)
    const pendingSignup = await PendingSignup.findByEmail(email);
    console.log("Pending signup found:", !!pendingSignup);
    if (pendingSignup) {
      console.log("  expiresAt:", pendingSignup.expiresAt);
      console.log("  isVerified:", pendingSignup.isVerified);
      console.log("  hashedOTP:", pendingSignup.hashedOTP ? "exists" : "missing");
      console.log("  otpExpiresAt:", pendingSignup.otpExpiresAt);
      console.log("  Now:", new Date());
      console.log("  Expired?:", Date.now() > pendingSignup.expiresAt.getTime());
      // Check if already verified
      if (pendingSignup.isVerified) {
        return res.status(400).json({
          success: false,
          message: "This email has already been verified. Please complete your profile.",
          data: { alreadyVerified: true, requiresProfileCompletion: true },
        });
      }

      // Check if expired
      if (Date.now() > pendingSignup.expiresAt.getTime()) {
        await PendingSignup.deleteOne({ _id: pendingSignup._id });
        return res.status(400).json({
          success: false,
          message: "Verification code has expired. Please start the signup process again.",
          data: { expired: true },
        });
      }

      // Track verification attempt
      pendingSignup.recordVerificationAttempt();
      await pendingSignup.save();

      // Max attempts
      if (pendingSignup.verificationAttempts > 5) {
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Please request a new verification code.",
          data: null,
        });
      }

      // Verify OTP
      const otpResult = pendingSignup.verifyOTP(otp);
      console.log("OTP verification result:", otpResult);
      if (!otpResult.valid) {
        console.log("OTP verification failed:", otpResult.reason);
        return res.status(400).json({
          success: false,
          message: otpResult.reason === "expired"
            ? "Verification code has expired. Please request a new one."
            : "Invalid verification code. Please try again.",
          data: null,
        });
      }
      console.log("OTP verified successfully!");

      // Mark as verified
      pendingSignup.markVerified();
      await pendingSignup.save();

      // Create the actual user account
      // Use _skipPasswordHashing flag to prevent pre-save middleware from re-hashing
      const newUser = new User({
        email: pendingSignup.email,
        password: pendingSignup.hashedPassword,
        emailVerified: true,
        isProfileComplete: false,
        onboarding: {
          status: "profile",
          step: "profile",
          source: "email",
          updatedAt: new Date(),
        },
      });
      newUser._skipPasswordHashing = true;
      await newUser.save();

      // Generate auth token
      const authToken = newUser.generateAuthToken();

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(newUser.email, email.split("@")[0]);
      } catch (error) {
        logger.error("Failed to send welcome email:", error);
      }

      return res.json({
        success: true,
        message: "Email verified successfully! Your account has been created.",
        data: {
          email: newUser.email,
          emailVerified: true,
          isProfileComplete: false,
          token: authToken,
          requiresProfileCompletion: true,
          onboarding: buildOnboardingPayload(newUser),
        },
      });
    }

    // SECOND: Check for legacy user (old flow - for backward compatibility)
    const user = await User.findOne({ email });
    if (user) {
      if (user.emailVerified) {
        return res.json({
          success: true,
          message: "Email is already verified",
          data: { emailVerified: true },
        });
      }

      if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
        return res.status(400).json({
          success: false,
          message: "No verification code found. Request a new code.",
          data: null,
        });
      }

      if (Date.now() > user.emailVerificationOtpExpires) {
        return res.status(400).json({
          success: false,
          message: "Verification code expired. Please request a new one.",
          data: null,
        });
      }

      const hashed = crypto.createHash("sha256").update(otp).digest("hex");
      if (hashed !== user.emailVerificationOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code.",
          data: null,
        });
      }

      // Mark verified
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.emailVerificationOtp = undefined;
      user.emailVerificationOtpExpires = undefined;
      await user.save();

      return res.json({
        success: true,
        message: "Email verified successfully",
        data: {
          emailVerified: true,
          email: user.email,
          requiresProfileCompletion: !user.isProfileComplete,
        },
      });
    }

    // No pending signup or user found
    console.log("No pending signup or user found for email:", email);
    return res.status(400).json({
      success: false,
      message: "Invalid verification code or email. Please start the signup process again.",
      data: null,
    });
  })
);

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const normalizedEmail = String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Avoid account enumeration and keep UX consistent.
      return res.json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
        data: {
          emailSent: true,
        },
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    let emailSent = true;
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      emailSent = false;
      logger.error("Failed to send password reset email:", error);

      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: "Failed to send password reset email",
          data: null,
        });
      }
    }

    const responseData = { emailSent };
    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.resetToken = resetToken;
      responseData.resetUrl = `${getFrontendBaseUrl()}/reset-password/${resetToken}`;
    }

    res.json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
      data: responseData,
    });
  })
);

// @desc    Admin: resend verification for a specific user
// @route   POST /api/auth/admin/resend-verification/:userId
// @access  Private (admin)
router.post(
  "/admin/resend-verification/:userId",
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only.", data: null });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found", data: null });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: "User email already verified", data: { emailVerified: true } });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    let emailSent = true;
    try {
      await emailService.sendResendVerificationEmail(user.email, verificationToken, { name: user.name });
    } catch (error) {
      emailSent = false;
      logger.error("Admin resend verification failed:", error);
    }

    res.json({
      success: true,
      message: emailSent ? "Verification email sent" : "Failed to send verification email",
      data: { emailSent },
    });
  })
);

// @desc    Smoke test: send a test email (dev or admin only)
// @route   POST /api/auth/smoke-email
// @access  Public (but restricted to dev/admin)
router.post(
  "/smoke-email",
  [body("to").optional().isEmail().normalizeEmail()],
  asyncHandler(async (req, res) => {
    const to = (req.body.to || process.env.SMOKE_EMAIL_TO || "prince844121@gmail.com").toLowerCase();

    // Allow in development or to admins only
    if (process.env.NODE_ENV === "production") {
      // Require admin auth in production
      if (!req.headers.authorization) {
        return res.status(401).json({ success: false, message: "Unauthorized", data: null });
      }
      // Authenticate token header
      try {
        await authenticateToken(req, res, async () => {});
      } catch (err) {
        return res.status(401).json({ success: false, message: "Unauthorized", data: null });
      }
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin only", data: null });
      }
    }

    let sent = true;
    try {
      // Use welcome email as a simple smoke test
      await emailService.sendWelcomeEmail(to, "iPrepmate Smoke Test");
    } catch (error) {
      sent = false;
      logger.error("Smoke email failed:", error);
    }

    res.json({
      success: sent,
      message: sent ? "Smoke email sent" : "Smoke email failed",
      data: { emailSent: sent },
    });
  })
);

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with this token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        data: null,
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
      data: null,
    });
  })
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("followers", "name username profilePicture")
      .populate("following", "name username profilePicture");

    const payloadUser = user?.toObject ? user.toObject() : user;
    if (payloadUser) {
      payloadUser.onboarding = buildOnboardingPayload(user);
    }

    res.json({
      success: true,
      data: {
        user: payloadUser,
      },
    });
  })
);

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
router.put(
  "/profile",
  authenticateToken,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("profile.bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    body("profile.location")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Location cannot exceed 100 characters"),
    body("profile.company")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Company cannot exceed 100 characters"),
    body("profile.position")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Position cannot exceed 100 characters"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { name, profilePicture, profile, preferences, settings } = req.body;

    const user = await User.findById(req.user.id);

    // Update fields
    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  })
);

// @desc    Update user settings and preferences
// @route   PUT /api/auth/settings
// @access  Private
router.put(
  "/settings",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { preferences, account, notifications } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Update preferences
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    // Update account settings
    if (account) {
      user.preferences = {
        ...user.preferences,
        account: {
          ...user.preferences?.account,
          ...account,
        },
      };
    }

    // Update notification settings
    if (notifications) {
      user.preferences = {
        ...user.preferences,
        notifications: {
          ...user.preferences?.notifications,
          ...notifications,
        },
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: {
        user,
      },
    });
  })
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword").optional().isString(),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    const hasPassword = !!user.password;

    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
          data: null,
        });
      }

      // Check current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
          data: null,
        });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: hasPassword
        ? "Password changed successfully"
        : "Password set successfully",
      data: null,
    });
  })
);

// @desc    Change account email
// @route   PUT /api/auth/change-email
// @access  Private
router.put(
  "/change-email",
  authenticateToken,
  [
    body("newEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("currentPassword").optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { newEmail, currentPassword } = req.body;
    const normalizedEmail = String(newEmail).toLowerCase();

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
        data: null,
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
        data: null,
      });
    }

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
          data: null,
        });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
          data: null,
        });
      }
    }

    user.email = normalizedEmail;
    user.emailVerified = false;
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    let emailSent = true;
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (sendError) {
      emailSent = false;
      logger.error("Failed to send verification email after email change:", sendError);
    }

    const responseData = {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
        profile: user.profile,
        progress: user.progress,
        metrics: user.metrics,
      },
      emailSent,
    };

    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.verificationToken = verificationToken;
    }

    res.json({
      success: true,
      message: emailSent
        ? "Email changed successfully. Please verify your new email address."
        : "Email changed successfully, but verification email could not be sent. Please check email configuration.",
      data: responseData,
    });
  })
);

// @desc    Unlink Google account
// @route   POST /api/auth/unlink-google
// @access  Private
router.post(
  "/unlink-google",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: "Google account is not linked",
        data: null,
      });
    }

    if (!user.password) {
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Set a password (at least 6 characters) before unlinking Google to keep access to your account",
          data: null,
        });
      }
      user.password = String(newPassword);
    }

    user.googleId = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Google account unlinked successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture,
          profile: user.profile,
          progress: user.progress,
          metrics: user.metrics,
        },
      },
    });
  })
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post(
  "/logout",
  authenticateToken,
  asyncHandler(async (req, res) => {
    console.log("=== LOGOUT REQUEST ===");
    console.log("User ID:", req.user.id);
    console.log("Token:", req.headers.authorization?.split(" ")[1]);

    const user = await User.findById(req.user.id);
    if (user) {
      // Mark user as offline
      user.goOffline();

      // Add current token to blacklist
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.exp) {
            const blacklisted = blacklistToken(token, decoded.exp);
            if (blacklisted) {
              console.log(
                `Token successfully blacklisted for user ${req.user.id}`
              );
            } else {
              console.log(
                `Token already expired, not blacklisting for user ${req.user.id}`
              );
            }
          }
        } catch (error) {
          console.error("Error blacklisting token:", error);
        }
      }

      try {
        await user.save();
        console.log("User marked as offline");
      } catch (error) {
        if (error.name === "ParallelSaveError") {
          // Retry with fresh document
          const freshUser = await User.findById(user._id);
          if (freshUser) {
            freshUser.goOffline();
            await freshUser.save();
            console.log("User marked as offline (retry)");
          }
        } else {
          throw error;
        }
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  })
);

// @desc    Check username availability
// @route   GET /api/auth/check-username
// @access  Public
router.get(
  "/check-username",
  asyncHandler(async (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
        data: null,
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    res.json({
      success: true,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
      data: { available: !existingUser },
    });
  })
);

const usernameValidationRules = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
];

const updateUsernameHandler = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: null,
      errors: errors.array(),
    });
  }

  const { username } = req.body;
  const userId = req.user.id;

  // Check if username is already taken
  const existingUser = await User.findOne({
    username: username.toLowerCase(),
    _id: { $ne: userId }, // Exclude current user
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Username is already taken",
      data: null,
    });
  }

  // Update user's username
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { username: username.toLowerCase() },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  res.json({
    success: true,
    message: "Username updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

// @desc    Set username for user
// @route   POST /api/auth/set-username
// @access  Private
router.post(
  "/set-username",
  authenticateToken,
  usernameValidationRules,
  updateUsernameHandler
);

// @desc    Update username (frontend compatibility alias)
// @route   PUT /api/auth/update-username
// @access  Private
router.put(
  "/update-username",
  authenticateToken,
  usernameValidationRules,
  updateUsernameHandler
);

// @desc    Complete Google OAuth user profile
// @route   POST /api/auth/complete-google-profile
// @access  Private
router.post(
  "/complete-google-profile",
  authenticateToken,
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be less than 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be less than 50 characters"),
    body("role")
      .trim()
      .isIn(["student", "teacher", "hr"])
      .withMessage("Please select a valid role (student, teacher, or hr)"),
    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other", "prefer-not-to-say"])
      .withMessage("Invalid gender selection"),
    body("mobileNumber")
      .optional()
      .custom((value) => {
        if (value && value.trim() !== "") {
          if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
            throw new Error("Invalid phone number format");
          }
        }
        return true;
      }),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location must be less than 100 characters"),
    body("website")
      .optional()
      .custom((value) => {
        if (value && value.trim() !== "") {
          if (!value.match(/^https?:\/\/.+/)) {
            throw new Error("Invalid website URL");
          }
        }
        return true;
      }),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio must be less than 500 characters"),
    body("profilePicture")
      .optional()
      .isURL()
      .withMessage("Invalid profile picture URL"),
  ],
  asyncHandler(async (req, res) => {
    console.log("=== COMPLETE GOOGLE PROFILE REQUEST ===");
    console.log("Request body:", req.body);
    console.log("User ID:", req.user?.id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      username,
      name,
      firstName,
      lastName,
      role,
      dateOfBirth,
      gender,
      mobileNumber,
      location,
      website,
      bio,
      profilePicture,
    } = req.body;

    // Check if username is already taken
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Update user profile
    const resolvedName = name || `${firstName || ""} ${lastName || ""}`.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        username: username.toLowerCase(),
        name: resolvedName || name,
        role,
        profilePicture,
        profile: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          mobileNumber,
          location,
          website,
          bio,
        },
        isProfileComplete: true,
        onboarding: {
          status: "complete",
          step: "complete",
          source: "google",
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new token
    const token = jwt.sign(
      { id: updatedUser._id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Profile completed successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          role: updatedUser.role,
          isProfileComplete: updatedUser.isProfileComplete,
          onboarding: buildOnboardingPayload(updatedUser),
        },
        token,
      },
    });
  })
);

// @desc    Delete account
// @route   DELETE /api/auth/delete-account
// @access  Private
router.delete(
  "/delete-account",
  authenticateToken,
  asyncHandler(async (req, res) => {
    console.log("=== DELETE ACCOUNT REQUEST ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    console.log("User ID:", req.user?.id);
    console.log("User object:", req.user);

    const { password } = req.body;

    if (!password) {
      console.log("❌ No password provided");
      return res.status(400).json({
        success: false,
        message: "Password is required for account deletion",
      });
    }

    console.log("🔍 Looking for user with ID:", req.user.id);
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User found:", user.email);
    console.log("🔐 Verifying password...");

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password verification result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    console.log("✅ Password verified, deleting user...");

    // Delete user and all associated data
    // Note: You might want to implement soft delete instead of hard delete
    // and add cascade deletion for related data (posts, comments, etc.)
    await User.findByIdAndDelete(user._id);

    console.log("✅ User deleted successfully");

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  })
);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post(
  "/refresh",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      data: {
        token,
      },
    });
  })
);

// @desc    Get Google OAuth data by ID
// @route   GET /api/auth/google-data/:id
// @access  Public
router.get(
  "/google-data/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log("=== GOOGLE DATA RETRIEVAL REQUEST ===");
    console.log("Requested ID:", id);
    console.log("Current store size:", googleDataStore.size);
    console.log("Available keys:", Array.from(googleDataStore.keys()));

    // Clean up expired data and retrieved data after 30 seconds
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of googleDataStore.entries()) {
      if (
        value.expiresAt < now ||
        (value.retrieved && now - value.retrievedAt > 30000)
      ) {
        googleDataStore.delete(key);
        cleanedCount++;
      }
    }

    console.log("Cleaned up", cleanedCount, "expired entries");
    console.log("Store size after cleanup:", googleDataStore.size);

    const storedData = googleDataStore.get(id);

    if (!storedData) {
      console.log("❌ Google data not found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Google data not found or expired",
      });
    }

    console.log("✅ Google data found for ID:", id);
    console.log("Data:", storedData.data);

    // Mark as retrieved but keep for a short time to handle multiple requests
    storedData.retrieved = true;
    storedData.retrievedAt = Date.now();

    res.json({
      success: true,
      data: storedData.data,
    });
  })
);

// @desc    Check token validity
// @route   GET /api/auth/me
// @access  Private
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    console.log("=== TOKEN VALIDATION REQUEST ===");
    console.log("User ID:", req.user.id);
    console.log("User role:", req.user.role);
    console.log(
      "Token:",
      req.headers.authorization?.split(" ")[1]?.substring(0, 20) + "..."
    );

    res.json({
      success: true,
      data: {
        user: req.user,
        tokenValid: true,
      },
    });
  })
);

// ============================================================
// SECURE MULTI-STEP SIGNUP & VERIFICATION FLOW
// ============================================================
// Flow:
// 1. POST /api/auth/start-signup - User enters email + password, creates pending signup
// 2. POST /api/auth/verify-signup-otp - Verify OTP, create real user account
// 3. POST /api/auth/resend-signup-otp - Resend OTP
// 4. GET /api/auth/verify-email-token - Verify via email link, create real user account
// 5. POST /api/auth/complete-profile - Complete profile with username after verification

// @desc    Start signup process - Create pending signup (NO user created yet)
// @route   POST /api/auth/start-signup
// @access  Public
router.post(
  "/start-signup",
  signupRateLimit,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and number"),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists (verified account)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please login.",
        data: null,
      });
    }

    // Check if there's already a pending signup for this email
    let pendingSignup = await PendingSignup.findByEmail(normalizedEmail);
    
    if (pendingSignup) {
      // Check if pending signup has expired
      if (Date.now() > pendingSignup.expiresAt.getTime()) {
        // Delete expired pending signup
        await PendingSignup.deleteOne({ _id: pendingSignup._id });
        pendingSignup = null;
      } else {
        // Check resend cooldown (2 minutes)
        const cooldownMs = 2 * 60 * 1000;
        if (pendingSignup.lastResendAt && 
            Date.now() - pendingSignup.lastResendAt.getTime() < cooldownMs) {
          const remainingSeconds = Math.ceil(
            (cooldownMs - (Date.now() - pendingSignup.lastResendAt.getTime())) / 1000
          );
          return res.status(429).json({
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
            data: {
              retryAfter: remainingSeconds,
              email: normalizedEmail,
            },
          });
        }

        // Check max resend limit (5 per day)
        if (pendingSignup.resendCount >= 5) {
          return res.status(429).json({
            success: false,
            message: "Maximum resend attempts reached. Please start a new signup.",
            data: null,
          });
        }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP and verification token
    let plainOTP, plainToken;
    
    if (pendingSignup) {
      // Update existing pending signup
      pendingSignup.hashedPassword = hashedPassword;
      pendingSignup.resendCount += 1;
      plainOTP = pendingSignup.generateOTP(6, 10);
      plainToken = pendingSignup.generateVerificationToken(24);
      pendingSignup.recordResend();
      pendingSignup.ipAddress = req.ip;
      pendingSignup.userAgent = req.headers["user-agent"];
      await pendingSignup.save();
    } else {
      // Create new pending signup
      pendingSignup = new PendingSignup({
        email: normalizedEmail,
        hashedPassword,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      plainOTP = pendingSignup.generateOTP(6, 10);
      plainToken = pendingSignup.generateVerificationToken(24);
      await pendingSignup.save();
    }

    // Send verification email with OTP
    let emailSent = true;
    try {
      await emailService.sendVerificationWithOtp(
        normalizedEmail,
        plainToken,
        plainOTP,
        { name: normalizedEmail.split("@")[0] }
      );
    } catch (error) {
      emailSent = false;
      logger.error("Failed to send verification email:", error);
    }

    // Prepare response
    const responseData = {
      email: normalizedEmail,
      emailSent,
      expiresIn: 600, // 10 minutes in seconds
      message: emailSent
        ? "Verification code sent to your email."
        : "Failed to send verification email. Please try again.",
    };

    // In development, include OTP and token for testing
    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.otpDev = plainOTP;
      responseData.tokenDev = plainToken;
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Signup initiated. Please check your email for the verification code."
        : "Signup initiated but email delivery failed.",
      data: responseData,
    });
  })
);

// @desc    Verify signup OTP - Creates real user account after verification
// @route   POST /api/auth/verify-signup-otp
// @access  Public
router.post(
  "/verify-signup-otp",
  verifyOtpRateLimit,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("Please enter a valid 6-digit verification code"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find pending signup
    const pendingSignup = await PendingSignup.findByEmail(normalizedEmail);
    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        message: "No pending signup found. Please start the signup process again.",
        data: null,
      });
    }

    // Check if already verified
    if (pendingSignup.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This email has already been verified. Please complete your profile.",
        data: { alreadyVerified: true },
      });
    }

    // Check if expired
    if (Date.now() > pendingSignup.expiresAt.getTime()) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please start the signup process again.",
        data: { expired: true },
      });
    }

    // Track verification attempt
    pendingSignup.recordVerificationAttempt();
    await pendingSignup.save();

    // Max verification attempts
    if (pendingSignup.verificationAttempts > 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new verification code.",
        data: null,
      });
    }

    // Verify OTP
    const otpResult = pendingSignup.verifyOTP(otp);
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.reason === "expired"
          ? "Verification code has expired. Please request a new one."
          : "Invalid verification code. Please try again.",
        data: null,
      });
    }

    // Mark pending signup as verified
    pendingSignup.markVerified();
    await pendingSignup.save();

    // Create the actual user account (only after verification!)
    // Use _skipPasswordHashing flag to prevent pre-save middleware from re-hashing
    const user = new User({
      email: pendingSignup.email,
      password: pendingSignup.hashedPassword, // Already hashed
      emailVerified: true,
      isProfileComplete: false,
      onboarding: {
        status: "profile",
        step: "profile",
        source: "email",
        updatedAt: new Date(),
      },
    });
    user._skipPasswordHashing = true;
    await user.save();

    // Generate auth token
    const authToken = user.generateAuthToken();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, normalizedEmail.split("@")[0]);
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
    }

    res.json({
      success: true,
      message: "Email verified successfully! Your account has been created.",
      data: {
        email: user.email,
        emailVerified: true,
        isProfileComplete: false,
        token: authToken,
        requiresProfileCompletion: true,
        onboarding: buildOnboardingPayload(user),
      },
    });
  })
);

// @desc    Resend signup OTP
// @route   POST /api/auth/resend-signup-otp
// @access  Public
router.post(
  "/resend-signup-otp",
  resendIpLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find pending signup
    const pendingSignup = await PendingSignup.findByEmail(normalizedEmail);
    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        message: "No pending signup found. Please start the signup process again.",
        data: null,
      });
    }

    // Check if already verified
    if (pendingSignup.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This email has already been verified.",
        data: null,
      });
    }

    // Check if expired
    if (Date.now() > pendingSignup.expiresAt.getTime()) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "Verification session has expired. Please start the signup process again.",
        data: { expired: true },
      });
    }

    // Check cooldown (2 minutes)
    const cooldownMs = 2 * 60 * 1000;
    if (pendingSignup.lastResendAt && 
        Date.now() - pendingSignup.lastResendAt.getTime() < cooldownMs) {
      const remainingSeconds = Math.ceil(
        (cooldownMs - (Date.now() - pendingSignup.lastResendAt.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        data: { retryAfter: remainingSeconds },
      });
    }

    // Check max resends
    if (pendingSignup.resendCount >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum resend attempts reached. Please start a new signup.",
        data: null,
      });
    }

    // Generate new OTP and token (invalidate old ones)
    const plainOTP = pendingSignup.generateOTP(6, 10);
    const plainToken = pendingSignup.generateVerificationToken(24);
    pendingSignup.recordResend();
    await pendingSignup.save();

    // Send new verification email
    let emailSent = true;
    try {
      await emailService.sendVerificationWithOtp(
        normalizedEmail,
        plainToken,
        plainOTP,
        { name: normalizedEmail.split("@")[0] }
      );
    } catch (error) {
      emailSent = false;
      logger.error("Failed to resend verification email:", error);
    }

    const responseData = {
      emailSent,
      expiresIn: 600,
    };

    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.otpDev = plainOTP;
      responseData.tokenDev = plainToken;
    }

    res.json({
      success: true,
      message: emailSent
        ? "New verification code sent. Check your email."
        : "Failed to send verification email.",
      data: responseData,
    });
  })
);

// @desc    Verify email via token (from email link) - Creates user account
// @route   GET /api/auth/verify-email-token
// @access  Public
router.get(
  "/verify-email-token",
  asyncHandler(async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
        data: null,
      });
    }

    // Find pending signup by token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const pendingSignup = await PendingSignup.findOne({
      verificationToken: hashedToken,
      isVerified: false,
    });

    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link. Please start the signup process again.",
        data: null,
      });
    }

    // Check if expired
    if (Date.now() > pendingSignup.expiresAt.getTime()) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "Verification link has expired. Please start the signup process again.",
        data: { expired: true },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: pendingSignup.email });
    if (existingUser) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please login.",
        data: null,
      });
    }

    // Mark as verified
    pendingSignup.markVerified();
    await pendingSignup.save();

    // Create the actual user account
    const user = new User({
      email: pendingSignup.email,
      password: pendingSignup.hashedPassword,
      emailVerified: true,
      isProfileComplete: false,
      onboarding: {
        status: "profile",
        step: "profile",
        source: "email",
        updatedAt: new Date(),
      },
    });
    user._skipPasswordHashing = true;
    await user.save();

    // Generate auth token
    const authToken = user.generateAuthToken();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, pendingSignup.email.split("@")[0]);
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
    }

    res.json({
      success: true,
      message: "Email verified successfully! Your account has been created.",
      data: {
        email: user.email,
        emailVerified: true,
        isProfileComplete: false,
        token: authToken,
        requiresProfileCompletion: true,
        onboarding: buildOnboardingPayload(user),
      },
    });
  })
);

// @desc    Complete profile after verification (set username, name, etc.)
// @route   POST /api/auth/complete-profile
// @access  Private (requires valid auth token)
router.post(
  "/complete-profile",
  authenticateToken,
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be less than 50 characters"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be less than 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be less than 50 characters"),
    body("role")
      .optional()
      .isIn(["student", "teacher", "hr"])
      .withMessage("Invalid role"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const {
      username,
      name,
      firstName,
      lastName,
      role,
      profilePicture,
      dateOfBirth,
      bio,
    } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Check if already profile complete
    if (user.isProfileComplete && user.username) {
      return res.status(400).json({
        success: false,
        message: "Profile is already complete",
        data: null,
      });
    }

    // Check username availability
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken. Please choose another.",
        data: null,
      });
    }

    // Update user profile
    const resolvedFirstName = firstName || user.profile?.firstName || "";
    const resolvedLastName = lastName || user.profile?.lastName || "";
    const resolvedName = name || `${resolvedFirstName} ${resolvedLastName}`.trim();

    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
        data: null,
      });
    }

    user.username = username.toLowerCase();
    user.name = resolvedName;
    user.isProfileComplete = true;

    if (role) user.role = role;
    if (profilePicture) user.profilePicture = profilePicture;
    if (dateOfBirth) user.profile.dateOfBirth = new Date(dateOfBirth);
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (bio) user.profile.bio = bio;

    user.onboarding = user.onboarding || {
      status: "profile",
      step: "profile",
      source: "unknown",
    };
    user.onboarding.status = "complete";
    user.onboarding.step = "complete";
    user.onboarding.updatedAt = new Date();

    await user.save();

    // Generate new token with updated info
    const authToken = user.generateAuthToken();

    res.json({
      success: true,
      message: "Profile completed successfully! Welcome to PrepMate.",
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          isProfileComplete: true,
          profilePicture: user.profilePicture,
          onboarding: buildOnboardingPayload(user),
        },
        token: authToken,
      },
    });
  })
);

// @desc    Get onboarding state
// @route   GET /api/auth/onboarding-state
// @access  Private
router.get(
  "/onboarding-state",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        onboarding: buildOnboardingPayload(user),
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
          isProfileComplete: user.isProfileComplete,
          profile: {
            firstName: user.profile?.firstName || "",
            lastName: user.profile?.lastName || "",
            dateOfBirth: user.profile?.dateOfBirth || null,
          },
        },
      },
    });
  })
);

// @desc    Update onboarding draft state
// @route   POST /api/auth/onboarding-state
// @access  Private
router.post(
  "/onboarding-state",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { step, profileDraft, usernameDraft } = req.body || {};

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.onboarding) {
      user.onboarding = {
        status: "profile",
        step: "profile",
        source: user.googleId ? "google" : "email",
        updatedAt: new Date(),
      };
    }

    if (step && ["profile", "username", "complete"].includes(step)) {
      user.onboarding.step = step;
      user.onboarding.status = user.isProfileComplete ? "complete" : step;
    }

    if (profileDraft && typeof profileDraft === "object") {
      user.onboarding.profileDraft = {
        ...user.onboarding.profileDraft,
        ...profileDraft,
      };
    }

    if (typeof usernameDraft === "string") {
      user.onboarding.usernameDraft = usernameDraft.toLowerCase();
    }

    user.onboarding.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        onboarding: buildOnboardingPayload(user),
      },
    });
  })
);

// @desc    Save onboarding profile step
// @route   POST /api/auth/onboarding/profile
// @access  Private
router.post(
  "/onboarding/profile",
  authenticateToken,
  [
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name is required"),
    body("dateOfBirth")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Invalid date format"),
    body("profilePicture").optional().isURL().withMessage("Invalid profile picture URL"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { firstName, lastName, dateOfBirth, profilePicture } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.profile = user.profile || {};
    user.profile.firstName = firstName;
    user.profile.lastName = lastName;
    user.profile.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    user.name = `${firstName} ${lastName}`.trim();

    if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    user.onboarding = user.onboarding || {
      status: "profile",
      step: "profile",
      source: user.googleId ? "google" : "email",
    };
    user.onboarding.profileDraft = {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      profilePicture: profilePicture || user.profilePicture || "",
    };
    user.onboarding.status = "username";
    user.onboarding.step = "username";
    user.onboarding.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Profile step saved",
      data: {
        onboarding: buildOnboardingPayload(user),
      },
    });
  })
);

// @desc    Save onboarding username step
// @route   POST /api/auth/onboarding/username
// @access  Private
router.post(
  "/onboarding/username",
  authenticateToken,
  usernameValidationRules,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username } = req.body;
    const normalized = username.toLowerCase();

    const existingUser = await User.findOne({
      username: normalized,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.username = normalized;
    user.isProfileComplete = true;
    user.onboarding = user.onboarding || {
      status: "username",
      step: "username",
      source: "unknown",
    };
    user.onboarding.status = "complete";
    user.onboarding.step = "complete";
    user.onboarding.usernameDraft = normalized;
    user.onboarding.updatedAt = new Date();

    await user.save();

    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: "Onboarding completed",
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          isProfileComplete: user.isProfileComplete,
          profilePicture: user.profilePicture,
          onboarding: buildOnboardingPayload(user),
        },
        token,
      },
    });
  })
);

// @desc    Upload profile picture during onboarding (authenticated)
// @route   POST /api/auth/onboarding/upload-profile-picture
// @access  Private
router.post(
  "/onboarding/upload-profile-picture",
  authenticateToken,
  onboardingUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const processedBuffer = await processImageBuffer(req.file.buffer, {
      width: 400,
      height: 400,
      fit: "cover",
      quality: 82,
      maxPixels: Number(process.env.IMAGE_MAX_PIXELS || 25000000),
    });

    const result = await uploadBuffer(processedBuffer, {
      folder: "profile-pictures",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    user.profilePicture = result.secure_url;
    user.onboarding = user.onboarding || {
      status: "profile",
      step: "profile",
      source: "unknown",
    };
    user.onboarding.profileDraft = {
      ...user.onboarding.profileDraft,
      profilePicture: result.secure_url,
    };
    user.onboarding.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

// @desc    Check if email has pending signup
// @route   GET /api/auth/pending-signup-status
// @access  Public
router.get(
  "/pending-signup-status",
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        data: null,
      });
    }

    const normalizedEmail = email.toLowerCase();
    const pendingSignup = await PendingSignup.findByEmail(normalizedEmail);

    if (!pendingSignup) {
      return res.json({
        success: true,
        message: "No pending signup found",
        data: {
          hasPendingSignup: false,
        },
      });
    }

    // Check if expired
    const isExpired = Date.now() > pendingSignup.expiresAt.getTime();
    if (isExpired) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.json({
        success: true,
        message: "Pending signup expired",
        data: {
          hasPendingSignup: false,
          expired: true,
        },
      });
    }

    // Calculate remaining time
    const remainingSeconds = Math.max(0, Math.floor(
      (pendingSignup.expiresAt.getTime() - Date.now()) / 1000
    ));

    res.json({
      success: true,
      message: "Pending signup found",
      data: {
        hasPendingSignup: true,
        email: pendingSignup.email,
        expiresIn: remainingSeconds,
        isVerified: pendingSignup.isVerified,
        resendCount: pendingSignup.resendCount,
      },
    });
  })
);

// @desc    Cleanup expired pending signups (admin only or scheduled job)
// @route   POST /api/auth/cleanup-pending-signups
// @access  Public (for scheduled jobs) or Private (for admin)
router.post(
  "/cleanup-pending-signups",
  asyncHandler(async (req, res) => {
    // If auth header is present, verify admin
    if (req.headers.authorization) {
      try {
        await authenticateToken(req, res, () => {});
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Admin access required",
            data: null,
          });
        }
      } catch (error) {
        // Continue without auth for scheduled jobs
      }
    }

    const deletedCount = await PendingSignup.cleanupExpired();
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired pending signups`,
      data: {
        deletedCount,
      },
    });
  })
);

// @desc    Check username availability
// @route   POST /api/auth/check-username
// @access  Public
router.post(
  "/check-username",
  asyncHandler(async (req, res) => {
    const { username } = req.body;

    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid username format",
        data: { available: false },
      });
    }

    const normalized = username.toLowerCase();
    const exists = await User.findOne({ username: normalized });

    res.json({
      success: true,
      data: { available: !exists, username: normalized },
    });
  })
);

// @desc    Complete Profile (After Email Verification)
// @route   POST /api/auth/complete-profile
// @access  Private (requires auth token from email verification)
router.post(
  "/complete-profile",
  authenticateToken,
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be less than 50 characters"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be less than 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be less than 50 characters"),
    body("role")
      .optional()
      .isIn(["student", "teacher", "hr"])
      .withMessage("Invalid role"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: null,
        errors: errors.array(),
      });
    }

    const { username, name, firstName, lastName, role, profilePicture } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isProfileComplete && user.username) {
      return res.status(400).json({
        success: false,
        message: "Profile is already complete",
      });
    }

    const normalizedUsername = username.toLowerCase();
    const existing = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: userId },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken. Please choose another.",
      });
    }

    const resolvedName = name || `${firstName || ""} ${lastName || ""}`.trim();
    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    user.username = normalizedUsername;
    user.name = resolvedName.trim();
    user.isProfileComplete = true;
    if (role) user.role = role;
    if (profilePicture) user.profilePicture = profilePicture;
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;

    user.onboarding = user.onboarding || {
      status: "profile",
      step: "profile",
      source: "unknown",
    };
    user.onboarding.status = "complete";
    user.onboarding.step = "complete";
    user.onboarding.updatedAt = new Date();

    await user.save();

    const authToken = user.generateAuthToken();

    res.json({
      success: true,
      message: "Profile completed successfully! Welcome to PrepMate.",
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          isProfileComplete: true,
          profilePicture: user.profilePicture,
          onboarding: buildOnboardingPayload(user),
        },
        token: authToken,
      },
    });
  })
);

// Legacy endpoints - keeping for backward compatibility during transition
// These will be deprecated and removed in future versions

// @desc    Verify Email with Token
// @route   POST /api/auth/verify-email
// @access  Public
router.post(
  "/verify-email",
  [body("token").notEmpty().withMessage("Verification token is required")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { token } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired verification token. Please request a new one.",
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message:
        "Email verified successfully. Please complete your profile to continue.",
      data: {
        email: user.email,
        emailVerified: true,
      },
    });
  })
);

// @desc    Check Username Availability (Debounced)
// @route   GET /api/auth/check-username
// @access  Public
router.get(
  "/check-username",
  asyncHandler(async (req, res) => {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // Validate format
    if (username.length < 3 || username.length > 30) {
      return res.json({
        available: false,
        reason: "Username must be 3-30 characters",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({
        available: false,
        reason: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Check if username is taken (use lean query for performance)
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    }).lean();

    res.json({
      available: !existingUser,
    });
  })
);

// @desc    Upload profile picture during onboarding (email verification token required)
// @route   POST /api/auth/upload-profile-picture
// @access  Public (requires valid email verification token)
router.post(
  "/upload-profile-picture",
  onboardingUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: "Email and verification token are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email: String(email).toLowerCase(),
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email verification. Please verify your email first.",
      });
    }

    const processedBuffer = await processImageBuffer(req.file.buffer, {
      width: 400,
      height: 400,
      fit: "cover",
      quality: 82,
      maxPixels: Number(process.env.IMAGE_MAX_PIXELS || 25000000),
    });

    const result = await uploadBuffer(processedBuffer, {
      folder: "profile-pictures",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

// @desc    Get Blacklist Statistics (for debugging)
// @route   GET /api/auth/blacklist-stats
// @access  Protected (admin)
router.get(
  "/blacklist-stats",
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Only allow admin to view blacklist stats
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const stats = getBlacklistStats();
    res.json({
      success: true,
      data: stats,
    });
  })
);

module.exports = router;
