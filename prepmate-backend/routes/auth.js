const express = require("express");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const emailService = require("../utils/emailService");
const { generateToken, verifyToken } = require("../utils/jwtUtils");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");
const {
  blacklistToken,
  getBlacklistStats,
} = require("../utils/tokenBlacklist");

const router = express.Router();

// Temporary storage for Google OAuth data (in production, use Redis or similar)
const googleDataStore = new Map();

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

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/google/callback",
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
      callbackURL: "/api/auth/admin/google/callback",
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

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      )
      .custom(async (value) => {
        const isAvailable = await User.isUsernameAvailable(value);
        if (!isAvailable) {
          throw new Error("Username is already taken");
        }
        return true;
      }),
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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
        errors: errors.array(),
      });
    }

    const { username, name, email, password, role = "student" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "User with this email already exists"
            : "Username is already taken",
      });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email,
      password,
      role,
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      logger.error("Failed to send verification email:", error);
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture,
        },
        token,
      },
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
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Check password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account currently uses Google sign-in. Set a password from Settings to enable email/password login.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
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
          profilePicture: updatedUser.profilePicture,
          profile: updatedUser.profile,
          progress: updatedUser.progress,
          metrics: updatedUser.metrics,
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
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  asyncHandler(async (req, res) => {
    try {
      console.log("=== GOOGLE OAUTH CALLBACK TRIGGERED ===");
      console.log("Request user:", req.user);
      console.log("Request body:", req.body);
      console.log("Request query:", req.query);

      const { user } = req;

      if (!user) {
        console.log("❌ No user found in request");
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/auth/google/error`
        );
      }

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
        // User has username, redirect to dashboard
        res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/auth/google/success?token=${token}&profileComplete=true`
        );
      } else {
        console.log("🔄 Redirecting to onboarding (user needs username)");
        // Profile incomplete, get stored Google data or create new
        const googleDataId = crypto.randomBytes(16).toString("hex");

        // Try to get stored Google data for this user
        let googleData = null;
        for (const [key, value] of googleDataStore.entries()) {
          if (value.data.email === user.email) {
            googleData = value.data;
            googleDataStore.delete(key); // Remove old entry
            break;
          }
        }

        // If no stored data, create basic data
        if (!googleData) {
          googleData = {
            name: user.name,
            email: user.email,
            picture: user.profilePicture,
          };
        }

        console.log("Generated Google data ID:", googleDataId);
        console.log("Google data to store:", googleData);

        // Store data temporarily (expires in 10 minutes)
        googleDataStore.set(googleDataId, {
          data: googleData,
          timestamp: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        console.log("✅ Google data stored successfully");
        console.log("Current store size:", googleDataStore.size);

        const redirectUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/google/success?token=${token}&profileComplete=false&googleDataId=${googleDataId}`;

        console.log("Redirecting to:", redirectUrl);
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/google/error`
      );
    }
  })
);

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
      });
    }

    // Update last login safely
    const updatedUser = await safeUserUpdate(user, { lastLogin: new Date() });

    // Generate JWT token
    const token = updatedUser.generateAuthToken();

    // Redirect to admin frontend with token
    const redirectUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/admin/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  })
);

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
router.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
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
        });
      }
    }

    const responseData = { emailSent };
    if (!emailSent && process.env.NODE_ENV !== "production") {
      responseData.resetToken = resetToken;
      responseData.resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    }

    res.json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
      data: responseData,
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

    res.json({
      success: true,
      data: {
        user,
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
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hasPassword = !!user.password;

    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      // Check current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
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
      });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
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
      });
    }

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
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
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: "Google account is not linked",
      });
    }

    if (!user.password) {
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Set a password (at least 6 characters) before unlinking Google to keep access to your account",
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
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
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
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        username: username.toLowerCase(),
        name,
        role,
        profilePicture,
        profile: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          mobileNumber,
          location,
          website,
          bio,
        },
        isProfileComplete: true,
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

// @desc    Get blacklist statistics (for debugging)
// @route   GET /api/auth/blacklist-stats
// @access  Private (Admin only)
router.get(
  "/blacklist-stats",
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Only allow admin to view blacklist stats
    if (req.user.role !== "admin") {
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
