const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot be more than 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password is required only if not using Google OAuth
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "hr", "admin", "support"],
      default: "student",
    },
    adminRole: {
      type: String,
      enum: ["superadmin", "moderator", "support_admin", "analytics_admin"],
      default: undefined,
      set: (value) => {
        if (value === null || value === undefined || value === "") {
          return undefined;
        }
        return value;
      },
    },
    permissions: {
      type: [String],
      default: [],
    },
    restrictions: {
      canPost: { type: Boolean, default: true },
      canComment: { type: Boolean, default: true },
      canFollow: { type: Boolean, default: true },
      canLink: { type: Boolean, default: true },
    },
    suspensionDetails: {
      reason: { type: String, default: "" },
      suspendedAt: { type: Date },
      suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      expiresAt: { type: Date },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    subscription: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    subscriptionExpires: Date,

    // Enhanced Profile Information
    profile: {
      bio: {
        type: String,
        trim: true,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      location: {
        type: String,
        trim: true,
        maxlength: [100, "Location cannot exceed 100 characters"],
      },
      website: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            return /^https?:\/\/.+/.test(v);
          },
          message: "Please enter a valid website URL",
        },
      },
      company: {
        type: String,
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"],
      },
      position: {
        type: String,
        trim: true,
        maxlength: [100, "Position cannot exceed 100 characters"],
      },
      dateOfBirth: {
        type: Date,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            const age = new Date().getFullYear() - v.getFullYear();
            return age >= 13 && age <= 100;
          },
          message: "Please enter a valid date of birth (age 13-100)",
        },
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer-not-to-say"],
      },
      mobileNumber: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            return /^\+?[\d\s\-\(\)]+$/.test(v);
          },
          message: "Please enter a valid phone number",
        },
      },
    },

    // Badges and Achievements
    badges: [
      {
        id: String,
        name: String,
        description: String,
        icon: String,
        earnedAt: {
          type: Date,
          default: Date.now,
        },
        category: {
          type: String,
          enum: ["achievement", "participation", "expertise", "social"],
        },
      },
    ],

    // Role-specific badges
    roleBadge: {
      type: String,
      enum: ["student", "teacher", "hr", "admin", "support"],
      default: "student",
    },

    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        newFollowers: { type: Boolean, default: true },
        newLikes: { type: Boolean, default: true },
        newComments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ["public", "private", "friends"],
          default: "public",
        },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        showFollowers: { type: Boolean, default: true },
        showFollowing: { type: Boolean, default: true },
        showPosts: {
          type: String,
          enum: ["public", "friends", "private"],
          default: "public",
        },
        showLikes: { type: Boolean, default: true },
        allowMessages: {
          type: String,
          enum: ["everyone", "friends", "none"],
          default: "everyone",
        },
        allowComments: {
          type: String,
          enum: ["everyone", "friends", "none"],
          default: "everyone",
        },
        showOnlineStatus: { type: Boolean, default: true },
        showLastSeen: { type: Boolean, default: true },
      },
      account: {
        twoFactorEnabled: { type: Boolean, default: false },
        loginNotifications: { type: Boolean, default: true },
        sessionTimeout: { type: Number, default: 24 }, // hours
        language: { type: String, default: "en" },
        theme: {
          type: String,
          enum: ["light", "dark", "auto"],
          default: "auto",
        },
        timezone: { type: String, default: "UTC" },
      },
    },

    // Learning progress tracking
    progress: {
      completedRoadmaps: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" },
      ],
      completedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
      completedInterviews: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
      ],
      totalStudyTime: { type: Number, default: 0 }, // in minutes
      streakDays: { type: Number, default: 0 },
      lastStudyDate: Date,
      questionsSolved: { type: Number, default: 0 },
      mockInterviewsCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },

    // Enhanced Social features
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Follow requests (Instagram-style)
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingFollowRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    followRequestActions: [
      {
        requester: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        actionBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: {
          type: String,
          enum: ["accepted", "rejected", "blocked"],
          required: true,
        },
        source: {
          type: String,
          enum: ["single", "bulk"],
          default: "single",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Blocked users
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Posts and Content
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // Support tickets
    supportTickets: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SupportTicket" },
    ],

    // Teacher/HR specific fields
    teacherProfile: {
      subjects: [String],
      experience: Number, // years
      rating: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      bio: String,
      availability: {
        type: String,
        enum: ["available", "busy", "unavailable"],
        default: "available",
      },
      hourlyRate: { type: Number, default: 0 },
      specializations: [String],
    },

    // Chat and messaging
    chatRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" }],
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },

    // Search and discovery
    searchable: { type: Boolean, default: true },
    tags: [String], // For search functionality
    interests: [String],

    // Account settings
    settings: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      theme: { type: String, enum: ["light", "dark", "auto"], default: "auto" },
    },

    // AI Companion settings
    aiCompanion: {
      geminiApiKey: {
        type: String,
        select: false, // Exclude from default queries for security
      },
      selectedVoiceModel: {
        type: String,
        default: "en-IN-female-1", // Default to Indian female voice
      },
      voicePreferences: {
        rate: { type: Number, default: 1 },
        pitch: { type: Number, default: 1 },
        volume: { type: Number, default: 1 },
      },
      isApiKeyValid: {
        type: Boolean,
        default: false,
      },
      lastApiKeyValidation: {
        type: Date,
      },
    },

    // Analytics and metrics
    metrics: {
      totalPosts: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
      lastProfileView: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search functionality
userSchema.index({
  name: "text",
  email: "text",
  "profile.bio": "text",
  skills: "text",
});
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "profile.location": 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Virtual for profile completion percentage
userSchema.virtual("profileCompletion").get(function () {
  const fields = [
    this.profile?.bio,
    this.profile?.location,
    this.profile?.company,
    this.profile?.position,
    this.profile?.skills?.length > 0,
    this.profile?.education?.length > 0,
    this.profilePicture,
  ];

  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
});

// Virtual for follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers?.length || 0;
});

// Virtual for following count
userSchema.virtual("followingCount").get(function () {
  return this.following?.length || 0;
});

// Virtual for friend count
userSchema.virtual("friendCount").get(function () {
  return this.friends?.length || 0;
});

// Virtual for post count
userSchema.virtual("postCount").get(function () {
  return this.posts?.length || 0;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  // Generate unique token with timestamp and random string for uniqueness
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      uniqueId: uniqueId,
      iat: timestamp,
      loginTime: timestamp,
    },
    process.env.JWT_SECRET || "fallback-secret-key",
    { expiresIn: "7d" }
  );
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Method to follow a user
userSchema.methods.followUser = async function (userId) {
  if (this._id.equals(userId)) {
    throw new Error("Cannot follow yourself");
  }

  const userToFollow = await this.model("User").findById(userId);
  if (!userToFollow) {
    throw new Error("User not found");
  }

  if (this.following.includes(userId)) {
    throw new Error("Already following this user");
  }

  this.following.push(userId);
  userToFollow.followers.push(this._id);

  try {
    await Promise.all([this.save(), userToFollow.save()]);
  } catch (error) {
    if (error.name === "ParallelSaveError") {
      // Retry with fresh documents
      const freshUser = await this.model("User").findById(this._id);
      const freshUserToFollow = await this.model("User").findById(userId);

      if (freshUser && freshUserToFollow) {
        if (!freshUser.following.includes(userId)) {
          freshUser.following.push(userId);
          freshUserToFollow.followers.push(freshUser._id);
          await Promise.all([freshUser.save(), freshUserToFollow.save()]);
          return freshUserToFollow;
        }
      }
    }
    throw error;
  }

  return userToFollow;
};

// Method to unfollow a user
userSchema.methods.unfollowUser = async function (userId) {
  const userToUnfollow = await this.model("User").findById(userId);
  if (!userToUnfollow) {
    throw new Error("User not found");
  }

  this.following = this.following.filter((id) => !id.equals(userId));
  userToUnfollow.followers = userToUnfollow.followers.filter(
    (id) => !id.equals(this._id)
  );

  try {
    await Promise.all([this.save(), userToUnfollow.save()]);
  } catch (error) {
    if (error.name === "ParallelSaveError") {
      // Retry with fresh documents
      const freshUser = await this.model("User").findById(this._id);
      const freshUserToUnfollow = await this.model("User").findById(userId);

      if (freshUser && freshUserToUnfollow) {
        freshUser.following = freshUser.following.filter(
          (id) => !id.equals(userId)
        );
        freshUserToUnfollow.followers = freshUserToUnfollow.followers.filter(
          (id) => !id.equals(freshUser._id)
        );
        await Promise.all([freshUser.save(), freshUserToUnfollow.save()]);
        return freshUserToUnfollow;
      }
    }
    throw error;
  }

  return userToUnfollow;
};

// Method to block a user
userSchema.methods.blockUser = async function (userId) {
  if (this._id.equals(userId)) {
    throw new Error("Cannot block yourself");
  }

  const userToBlock = await this.model("User").findById(userId);
  if (!userToBlock) {
    throw new Error("User not found");
  }

  if (this.blockedUsers.includes(userId)) {
    throw new Error("User is already blocked");
  }

  // Remove from following/followers if exists
  this.following = this.following.filter((id) => !id.equals(userId));
  this.followers = this.followers.filter((id) => !id.equals(userId));
  this.friends = this.friends.filter((id) => !id.equals(userId));

  userToBlock.following = userToBlock.following.filter(
    (id) => !id.equals(this._id)
  );
  userToBlock.followers = userToBlock.followers.filter(
    (id) => !id.equals(this._id)
  );
  userToBlock.friends = userToBlock.friends.filter(
    (id) => !id.equals(this._id)
  );

  this.blockedUsers.push(userId);
  userToBlock.blockedBy.push(this._id);

  try {
    await Promise.all([this.save(), userToBlock.save()]);
  } catch (error) {
    if (error.name === "ParallelSaveError") {
      // Retry with fresh documents
      const freshUser = await this.model("User").findById(this._id);
      const freshUserToBlock = await this.model("User").findById(userId);

      if (freshUser && freshUserToBlock) {
        if (!freshUser.blockedUsers.includes(userId)) {
          // Remove from following/followers if exists
          freshUser.following = freshUser.following.filter(
            (id) => !id.equals(userId)
          );
          freshUser.followers = freshUser.followers.filter(
            (id) => !id.equals(userId)
          );
          freshUser.friends = freshUser.friends.filter(
            (id) => !id.equals(userId)
          );

          freshUserToBlock.following = freshUserToBlock.following.filter(
            (id) => !id.equals(freshUser._id)
          );
          freshUserToBlock.followers = freshUserToBlock.followers.filter(
            (id) => !id.equals(freshUser._id)
          );
          freshUserToBlock.friends = freshUserToBlock.friends.filter(
            (id) => !id.equals(freshUser._id)
          );

          freshUser.blockedUsers.push(userId);
          freshUserToBlock.blockedBy.push(freshUser._id);

          await Promise.all([freshUser.save(), freshUserToBlock.save()]);
          return freshUserToBlock;
        }
      }
    }
    throw error;
  }

  return userToBlock;
};

// Method to unblock a user
userSchema.methods.unblockUser = async function (userId) {
  const userToUnblock = await this.model("User").findById(userId);
  if (!userToUnblock) {
    throw new Error("User not found");
  }

  this.blockedUsers = this.blockedUsers.filter((id) => !id.equals(userId));
  userToUnblock.blockedBy = userToUnblock.blockedBy.filter(
    (id) => !id.equals(this._id)
  );

  try {
    await Promise.all([this.save(), userToUnblock.save()]);
  } catch (error) {
    if (error.name === "ParallelSaveError") {
      // Retry with fresh documents
      const freshUser = await this.model("User").findById(this._id);
      const freshUserToUnblock = await this.model("User").findById(userId);

      if (freshUser && freshUserToUnblock) {
        freshUser.blockedUsers = freshUser.blockedUsers.filter(
          (id) => !id.equals(userId)
        );
        freshUserToUnblock.blockedBy = freshUserToUnblock.blockedBy.filter(
          (id) => !id.equals(freshUser._id)
        );
        await Promise.all([freshUser.save(), freshUserToUnblock.save()]);
        return freshUserToUnblock;
      }
    }
    throw error;
  }

  return userToUnblock;
};

// Method to check if following a user
userSchema.methods.isFollowing = function (userId) {
  return this.following.some((id) => id.equals(userId));
};

// Method to check if blocked a user
userSchema.methods.hasBlocked = function (userId) {
  return this.blockedUsers.some((id) => id.equals(userId));
};

// Method to check if blocked by a user
userSchema.methods.isBlockedBy = function (userId) {
  return this.blockedBy.some((id) => id.equals(userId));
};

// Method to get mutual friends
userSchema.methods.getMutualFriends = async function (userId) {
  const otherUser = await this.model("User").findById(userId);
  if (!otherUser) return [];

  const mutualFriends = this.friends.filter((friendId) =>
    otherUser.friends.some((id) => id.equals(friendId))
  );

  return await this.model("User").find({ _id: { $in: mutualFriends } });
};

// Method to update last seen
userSchema.methods.updateLastSeen = function () {
  this.lastSeen = new Date();
  this.isOnline = true;
  // Don't save here to avoid parallel save conflicts
  // The calling code should handle the save
};

// Method to go offline
userSchema.methods.goOffline = function () {
  this.isOnline = false;
  // Don't save here to avoid parallel save conflicts
  // The calling code should handle the save
};

// Static method to check username availability
userSchema.statics.isUsernameAvailable = async function (username) {
  const user = await this.findOne({ username: username.toLowerCase() });
  return !user;
};

// Static method to search users
userSchema.statics.searchUsers = async function (query, options = {}) {
  const {
    limit = 20,
    skip = 0,
    role,
    isActive = true,
    excludeIds = [],
    includeIds = [],
  } = options;

  let searchQuery = {
    $and: [
      { isActive },
      {
        $or: [
          { username: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { "profile.bio": { $regex: query, $options: "i" } },
          { skills: { $in: [new RegExp(query, "i")] } },
          { "profile.company": { $regex: query, $options: "i" } },
          { "profile.position": { $regex: query, $options: "i" } },
        ],
      },
    ],
  };

  if (role) {
    searchQuery.$and.push({ role });
  }

  if (excludeIds.length > 0) {
    searchQuery.$and.push({ _id: { $nin: excludeIds } });
  }

  if (includeIds.length > 0) {
    searchQuery.$and.push({ _id: { $in: includeIds } });
  }

  return await this.find(searchQuery)
    .select(
      "username name email profilePicture role profile.profile.bio profile.company profile.position skills"
    )
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("User", userSchema);
