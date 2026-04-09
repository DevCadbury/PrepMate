const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/User");
const { verifyTokenMiddleware, requireRole } = require("../utils/jwtUtils");
const { authenticateToken } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const hasUserId = (list, userId) => {
  if (!Array.isArray(list) || !userId) return false;
  const target = userId.toString();
  return list.some((id) => id.toString() === target);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const areUsersBlocked = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  const currentUserId = (currentUser._id || currentUser.id || "").toString();
  const targetUserId = (targetUser._id || targetUser.id || "").toString();

  return (
    hasUserId(currentUser.blockedUsers, targetUserId) ||
    hasUserId(currentUser.blockedBy, targetUserId) ||
    hasUserId(targetUser.blockedUsers, currentUserId) ||
    hasUserId(targetUser.blockedBy, currentUserId)
  );
};

const appendFollowRequestActions = async (ownerId, actions) => {
  if (!ownerId || !Array.isArray(actions) || actions.length === 0) {
    return;
  }

  const normalizedActions = actions
    .filter(
      (action) =>
        action &&
        action.requester &&
        action.actionBy &&
        ["accepted", "rejected", "blocked"].includes(action.action)
    )
    .map((action) => ({
      requester: action.requester,
      actionBy: action.actionBy,
      action: action.action,
      source: action.source === "bulk" ? "bulk" : "single",
      createdAt: action.createdAt || new Date(),
    }));

  if (normalizedActions.length === 0) {
    return;
  }

  await User.findByIdAndUpdate(ownerId, {
    $push: {
      followRequestActions: {
        $each: normalizedActions,
        $slice: -200,
      },
    },
  });
};

// Apply authentication middleware to all routes
router.use(verifyTokenMiddleware);

// Use the model from environment variable or default to gemini-2.5-flash-preview-native-audio-dialog
const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || "gemini-2.5-flash-preview-native-audio-dialog";

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select(
      "-password -emailVerificationToken -passwordResetToken"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
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
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location cannot exceed 100 characters"),
    body("profile.website")
      .optional()
      .isURL()
      .withMessage("Please provide a valid website URL"),
    body("profile.company")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Company name cannot exceed 100 characters"),
    body("profile.position")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Position cannot exceed 100 characters"),
    body("profile.experience")
      .optional()
      .isIn(["beginner", "intermediate", "advanced", "expert"])
      .withMessage("Invalid experience level"),
    body("profile.skills")
      .optional()
      .isArray()
      .withMessage("Skills must be an array"),
    body("profile.education")
      .optional()
      .isArray()
      .withMessage("Education must be an array"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const updateData = {};

    // Update basic fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.avatar) updateData.avatar = req.body.avatar;

    // Update profile fields
    if (req.body.profile) {
      updateData.profile = { ...req.user.profile, ...req.body.profile };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  })
);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put(
  "/preferences",
  [
    body("preferences.account.twoFactorEnabled")
      .optional()
      .isBoolean()
      .withMessage("Two-factor setting must be a boolean"),
    body("preferences.notifications.email")
      .optional()
      .isBoolean()
      .withMessage("Email notifications must be a boolean"),
    body("preferences.notifications.push")
      .optional()
      .isBoolean()
      .withMessage("Push notifications must be a boolean"),
    body("preferences.notifications.sms")
      .optional()
      .isBoolean()
      .withMessage("SMS notifications must be a boolean"),
    body("preferences.privacy.profileVisibility")
      .optional()
      .isIn(["public", "private", "friends"])
      .withMessage("Invalid profile visibility setting"),
    body("preferences.privacy.showEmail")
      .optional()
      .isBoolean()
      .withMessage("Show email must be a boolean"),
    body("preferences.privacy.showPhone")
      .optional()
      .isBoolean()
      .withMessage("Show phone must be a boolean"),
    body("preferences.privacy.showFollowers")
      .optional()
      .isBoolean()
      .withMessage("Show followers must be a boolean"),
    body("preferences.privacy.showFollowing")
      .optional()
      .isBoolean()
      .withMessage("Show following must be a boolean"),
    body("preferences.privacy.showPosts")
      .optional()
      .isIn(["public", "friends", "private"])
      .withMessage("Invalid post visibility setting"),
    body("preferences.privacy.allowMessages")
      .optional()
      .isIn(["everyone", "friends", "none"])
      .withMessage("Invalid allow messages setting"),
    body("preferences.privacy.allowComments")
      .optional()
      .isIn(["everyone", "friends", "none"])
      .withMessage("Invalid allow comments setting"),
    body("preferences.privacy.showOnlineStatus")
      .optional()
      .isBoolean()
      .withMessage("Show online status must be a boolean"),
    body("preferences.privacy.showLastSeen")
      .optional()
      .isBoolean()
      .withMessage("Show last seen must be a boolean"),
    body("preferences.privacy.showProgress")
      .optional()
      .isBoolean()
      .withMessage("Show progress must be a boolean"),
    body("preferences.notifications.newFollowers")
      .optional()
      .isBoolean()
      .withMessage("New followers notification must be a boolean"),
    body("preferences.notifications.newLikes")
      .optional()
      .isBoolean()
      .withMessage("New likes notification must be a boolean"),
    body("preferences.notifications.newComments")
      .optional()
      .isBoolean()
      .withMessage("New comments notification must be a boolean"),
    body("preferences.notifications.mentions")
      .optional()
      .isBoolean()
      .withMessage("Mentions notification must be a boolean"),
    body("preferences.notifications.achievements")
      .optional()
      .isBoolean()
      .withMessage("Achievements notification must be a boolean"),
    body("preferences.theme")
      .optional()
      .isIn(["light", "dark", "auto"])
      .withMessage("Invalid theme setting"),

    body("account.twoFactorEnabled")
      .optional()
      .isBoolean()
      .withMessage("Two-factor setting must be a boolean"),
    body("privacy.profileVisibility")
      .optional()
      .isIn(["public", "private", "friends"])
      .withMessage("Invalid profile visibility setting"),
    body("privacy.showEmail")
      .optional()
      .isBoolean()
      .withMessage("Show email must be a boolean"),
    body("privacy.showPhone")
      .optional()
      .isBoolean()
      .withMessage("Show phone must be a boolean"),
    body("privacy.showFollowers")
      .optional()
      .isBoolean()
      .withMessage("Show followers must be a boolean"),
    body("privacy.showFollowing")
      .optional()
      .isBoolean()
      .withMessage("Show following must be a boolean"),
    body("privacy.showPosts")
      .optional()
      .isIn(["public", "friends", "private"])
      .withMessage("Invalid post visibility setting"),
    body("privacy.allowMessages")
      .optional()
      .isIn(["everyone", "friends", "none"])
      .withMessage("Invalid allow messages setting"),
    body("privacy.allowComments")
      .optional()
      .isIn(["everyone", "friends", "none"])
      .withMessage("Invalid allow comments setting"),
    body("privacy.showOnlineStatus")
      .optional()
      .isBoolean()
      .withMessage("Show online status must be a boolean"),
    body("privacy.showLastSeen")
      .optional()
      .isBoolean()
      .withMessage("Show last seen must be a boolean"),
    body("notifications.newFollowers")
      .optional()
      .isBoolean()
      .withMessage("New followers notification must be a boolean"),
    body("notifications.newLikes")
      .optional()
      .isBoolean()
      .withMessage("New likes notification must be a boolean"),
    body("notifications.newComments")
      .optional()
      .isBoolean()
      .withMessage("New comments notification must be a boolean"),
    body("notifications.mentions")
      .optional()
      .isBoolean()
      .withMessage("Mentions notification must be a boolean"),
    body("notifications.achievements")
      .optional()
      .isBoolean()
      .withMessage("Achievements notification must be a boolean"),
    body("theme")
      .optional()
      .isIn(["light", "dark", "auto"])
      .withMessage("Invalid theme setting"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const updateData = {};

    const incomingPreferences =
      req.body.preferences && typeof req.body.preferences === "object"
        ? { ...req.body.preferences }
        : {};

    if (req.body.account && typeof req.body.account === "object") {
      incomingPreferences.account = {
        ...(incomingPreferences.account || {}),
        ...req.body.account,
      };
    }

    if (req.body.privacy && typeof req.body.privacy === "object") {
      incomingPreferences.privacy = {
        ...(incomingPreferences.privacy || {}),
        ...req.body.privacy,
      };
    }

    if (
      req.body.notifications &&
      typeof req.body.notifications === "object"
    ) {
      incomingPreferences.notifications = {
        ...(incomingPreferences.notifications || {}),
        ...req.body.notifications,
      };
    }

    if (req.body.theme && !incomingPreferences.account?.theme) {
      incomingPreferences.account = {
        ...(incomingPreferences.account || {}),
        theme: req.body.theme,
      };
    }

    const hasPreferenceUpdate =
      Object.keys(incomingPreferences.account || {}).length > 0 ||
      Object.keys(incomingPreferences.privacy || {}).length > 0 ||
      Object.keys(incomingPreferences.notifications || {}).length > 0;

    if (hasPreferenceUpdate) {
      const currentPreferences = req.user.preferences || {};
      updateData.preferences = {
        ...currentPreferences,
        account: {
          ...(currentPreferences.account || {}),
          ...(incomingPreferences.account || {}),
        },
        privacy: {
          ...(currentPreferences.privacy || {}),
          ...(incomingPreferences.privacy || {}),
        },
        notifications: {
          ...(currentPreferences.notifications || {}),
          ...(incomingPreferences.notifications || {}),
        },
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: { user },
    });
  })
);

// @route   GET /api/users/search
// @desc    Search users by username or name
// @access  Private
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    // Search by username or name (case-insensitive)
    const searchRegex = new RegExp(q.trim(), "i");
    const users = await User.find({
      $or: [{ username: searchRegex }, { name: searchRegex }],
      _id: { $ne: currentUserId }, // Exclude current user
      isActive: true, // Only active users
    })
      .select(
        "name username profilePicture profile.location preferences.privacy"
      )
      .limit(20);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @route   GET /api/users/follow-requests
// @desc    Get pending follow requests
// @access  Private
router.get(
  "/follow-requests",
  asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user.id)
      .populate("followRequests", "name username profilePicture")
      .populate("blockedUsers", "name username profilePicture")
      .select("followRequests blockedUsers blockedBy");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const blockedIdSet = new Set([
      ...(currentUser.blockedUsers || []).map((blockedUser) =>
        blockedUser._id ? blockedUser._id.toString() : blockedUser.toString()
      ),
      ...(currentUser.blockedBy || []).map((id) => id.toString()),
    ]);

    const followRequests = (currentUser.followRequests || []).filter(
      (followRequestUser) => !blockedIdSet.has(followRequestUser._id.toString())
    );

    res.json({
      success: true,
      data: {
        followRequests,
        blockedUsers: currentUser.blockedUsers || [],
      },
    });
  })
);

// @route   GET /api/users/follow-requests/history
// @desc    Get follow request action history for current user
// @access  Private
router.get(
  "/follow-requests/history",
  asyncHandler(async (req, res) => {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit)
      ? 30
      : Math.max(1, Math.min(requestedLimit, 100));

    const currentUser = await User.findById(req.user.id)
      .select("followRequestActions")
      .populate("followRequestActions.requester", "name username profilePicture")
      .populate("followRequestActions.actionBy", "name username profilePicture");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const actions = [...(currentUser.followRequestActions || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((action) => ({
        _id: action._id,
        requester: action.requester,
        actionBy: action.actionBy,
        action: action.action,
        source: action.source || "single",
        createdAt: action.createdAt,
      }));

    res.json({
      success: true,
      data: {
        actions,
        total: currentUser.followRequestActions?.length || 0,
      },
    });
  })
);

// @route   GET /api/users/following
// @desc    Get user's following list
// @access  Private
router.get(
  "/following",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate("following", "name username avatar profile stats")
      .select("following");

    res.json({
      success: true,
      data: { following: user.following || [] },
    });
  })
);

// @route   GET /api/users/followers
// @desc    Get user's followers list
// @access  Private
router.get(
  "/followers",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate("followers", "name username avatar profile stats")
      .select("followers");

    res.json({
      success: true,
      data: { followers: user.followers || [] },
    });
  })
);

// @route   GET /api/users/blocked
// @desc    Get blocked users list
// @access  Private
router.get(
  "/blocked",
  asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user.id)
      .populate("blockedUsers", "name username profilePicture")
      .select("blockedUsers");

    res.json({
      success: true,
      data: { blockedUsers: currentUser.blockedUsers || [] },
    });
  })
);

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID (with privacy checks)
// @access  Private
router.get(
  "/profile/:id",
  asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const targetUser = await User.findById(targetUserId)
      .populate("followers", "name username profilePicture")
      .populate("following", "name username profilePicture")
      .populate("followRequests", "name username profilePicture");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isProfileOwner = targetUserId === currentUserId;
    const isFollowing = hasUserId(currentUser.following, targetUserId);
    const hasFollowRequest = hasUserId(
      targetUser.followRequests,
      currentUserId
    );
    const isPrivate =
      targetUser.preferences?.privacy?.profileVisibility === "private";
    const canFollow = !isProfileOwner && !isFollowing && !hasFollowRequest;
    // For private profiles, only show posts if user is actually following (not just requested)
    const canViewPosts =
      isProfileOwner || !isPrivate || (isFollowing && !hasFollowRequest);

    // Get user's posts if they can be viewed
    let posts = [];
    if (canViewPosts) {
      const Post = require("../models/Post");
      posts = await Post.find({ user: targetUserId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name username profilePicture");
    }

    // Prepare response data
    const profileData = {
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture,
        role: targetUser.role,
        profile: targetUser.profile,
      },
      isProfileOwner,
      isFollowing,
      hasFollowRequest,
      canFollow,
      isPrivate,
      canViewPosts,
      followers: targetUser.followers || [],
      following: targetUser.following || [],
      posts: posts.map((post) => ({
        id: post._id,
        content: post.content,
        type: post.type || "text",
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        createdAt: post.createdAt,
        isLiked: post.likes?.includes(currentUserId) || false,
        isSaved: false, // TODO: Implement saved posts
      })),
    };

    res.json({
      success: true,
      data: profileData,
    });
  })
);

// @route   GET /api/users/:id
// @desc    Get user by ID (with privacy checks and follow functionality)
// @access  Private
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const targetUser = await User.findById(targetUserId)
      .populate("followers", "name username profilePicture")
      .populate("following", "name username profilePicture")
      .populate("followRequests", "name username profilePicture");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isProfileOwner = targetUserId === currentUserId;
    const isFollowing = hasUserId(currentUser.following, targetUserId);
    const hasFollowRequest = hasUserId(
      targetUser.followRequests,
      currentUserId
    );
    const isPrivate =
      targetUser.preferences?.privacy?.profileVisibility === "private";
    const canFollow = !isProfileOwner && !isFollowing && !hasFollowRequest;
    // For private profiles, only show posts if user is actually following (not just requested)
    const canViewPosts =
      isProfileOwner || !isPrivate || (isFollowing && !hasFollowRequest);

    // Get user's posts if they can be viewed
    let posts = [];
    if (canViewPosts) {
      const Post = require("../models/Post");
      posts = await Post.find({ user: targetUserId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name username profilePicture");
    }

    // Prepare response data
    const profileData = {
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture,
        role: targetUser.role,
        profile: targetUser.profile,
      },
      isProfileOwner,
      isFollowing,
      hasFollowRequest,
      canFollow,
      isPrivate,
      canViewPosts,
      followers: targetUser.followers || [],
      following: targetUser.following || [],
      posts: posts.map((post) => ({
        id: post._id,
        content: post.content,
        type: post.type || "text",
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        createdAt: post.createdAt,
        isLiked: post.likes?.includes(currentUserId) || false,
        isSaved: false, // TODO: Implement saved posts
      })),
    };

    res.json({
      success: true,
      data: profileData,
    });
  })
);

// @route   POST /api/users/follow/:id
// @desc    Follow a user or send follow request
// @access  Private
router.post(
  "/follow/:id",
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(req.user.id);

    if (areUsersBlocked(currentUser, userToFollow)) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot follow this user because one of you has blocked the other",
      });
    }

    // Check if already following
    if (hasUserId(currentUser.following, req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // Check if follow request already sent
    if (hasUserId(userToFollow.followRequests, req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Follow request already sent",
      });
    }

    // Check if target user has private profile
    if (userToFollow.preferences?.privacy?.profileVisibility === "private") {
      // Send follow request instead of following directly
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followRequests: req.user.id },
      });

      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { pendingFollowRequests: req.params.id },
      });

      // Create notification for the target user (follow request received)
      const Notification = require("../models/Notification");
      await Notification.create({
        type: "follow_request",
        message: `${currentUser.name} sent you a follow request`,
        userId: req.params.id, // Target user receives notification
        user: req.user.id, // Current user is the requester
      });

      return res.json({
        success: true,
        message: "Follow request sent successfully",
        isFollowRequest: true,
      });
    } else {
      // Public profile - follow directly
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { following: req.params.id },
      });

      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user.id },
      });

      return res.json({
        success: true,
        message: "User followed successfully",
        isFollowRequest: false,
      });
    }
  })
);

// @route   POST /api/users/accept-follow-request/:id
// @desc    Accept a follow request
// @access  Private
router.post(
  "/accept-follow-request/:id",
  asyncHandler(async (req, res) => {
    const requesterId = req.params.id;
    const currentUserId = req.user.id;

    if (!isValidObjectId(requesterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requester ID",
      });
    }

    const [currentUser, requester] = await Promise.all([
      User.findById(currentUserId),
      User.findById(requesterId),
    ]);

    if (!currentUser || !requester) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (areUsersBlocked(currentUser, requester)) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot accept this request while either user is blocked. Unblock first.",
      });
    }

    // Check if follow request exists
    if (!hasUserId(currentUser.followRequests, requesterId)) {
      return res.status(400).json({
        success: false,
        message: "No follow request from this user",
      });
    }

    // Accept the follow request
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followRequests: requesterId },
      $addToSet: { followers: requesterId },
    });

    await User.findByIdAndUpdate(requesterId, {
      $pull: { pendingFollowRequests: currentUserId },
      $addToSet: { following: currentUserId },
    });

    await appendFollowRequestActions(currentUserId, [
      {
        requester: requesterId,
        actionBy: currentUserId,
        action: "accepted",
        source: "single",
      },
    ]);

    // Create notification for the requester (follow request accepted)
    const Notification = require("../models/Notification");
    await Notification.create({
      type: "follow_accepted",
      message: `${currentUser.name} accepted your follow request`,
      userId: requesterId, // Requester receives notification
      user: currentUserId, // Current user is the accepter
    });

    res.json({
      success: true,
      message: "Follow request accepted",
    });
  })
);

// @route   POST /api/users/reject-follow-request/:id
// @desc    Reject a follow request
// @access  Private
router.post(
  "/reject-follow-request/:id",
  asyncHandler(async (req, res) => {
    const requesterId = req.params.id;
    const currentUserId = req.user.id;

    if (!isValidObjectId(requesterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requester ID",
      });
    }

    const [currentUser, requester] = await Promise.all([
      User.findById(currentUserId),
      User.findById(requesterId),
    ]);

    if (!currentUser || !requester) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if follow request exists
    if (!hasUserId(currentUser.followRequests, requesterId)) {
      return res.status(400).json({
        success: false,
        message: "No follow request from this user",
      });
    }

    // Reject the follow request
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followRequests: requesterId },
    });

    await User.findByIdAndUpdate(requesterId, {
      $pull: { pendingFollowRequests: currentUserId },
    });

    await appendFollowRequestActions(currentUserId, [
      {
        requester: requesterId,
        actionBy: currentUserId,
        action: "rejected",
        source: "single",
      },
    ]);

    res.json({
      success: true,
      message: "Follow request rejected",
    });
  })
);

// @route   POST /api/users/follow-requests/bulk
// @desc    Bulk accept/reject follow requests
// @access  Private
router.post(
  "/follow-requests/bulk",
  asyncHandler(async (req, res) => {
    const { action, userIds } = req.body;
    const currentUserId = req.user.id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'accept' or 'reject'.",
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be a non-empty array",
      });
    }

    const normalizedUserIds = [...new Set(userIds.map((id) => id?.toString()))].filter(
      (id) => id && isValidObjectId(id)
    );

    if (normalizedUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid user IDs provided",
      });
    }

    const currentUser = await User.findById(currentUserId).select(
      "followRequests blockedUsers blockedBy name"
    );
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validRequesterIds = normalizedUserIds.filter((requesterId) =>
      hasUserId(currentUser.followRequests, requesterId)
    );

    if (validRequesterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid follow requests found for provided users",
      });
    }

    let processRequesterIds = validRequesterIds;
    let skippedBlockedRequesterIds = [];

    if (action === "accept") {
      const requesterUsers = await User.find({
        _id: { $in: validRequesterIds },
      }).select("blockedUsers blockedBy");

      const blockedRequesterIdSet = new Set(
        requesterUsers
          .filter((requesterUser) => areUsersBlocked(currentUser, requesterUser))
          .map((requesterUser) => requesterUser._id.toString())
      );

      processRequesterIds = validRequesterIds.filter(
        (requesterId) => !blockedRequesterIdSet.has(requesterId)
      );
      skippedBlockedRequesterIds = validRequesterIds.filter((requesterId) =>
        blockedRequesterIdSet.has(requesterId)
      );
    }

    if (processRequesterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          action === "accept"
            ? "All selected requests were skipped because one of the users is blocked"
            : "No valid follow requests found for provided users",
        data: {
          skippedBlockedUserIds: skippedBlockedRequesterIds,
        },
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followRequests: { $in: processRequesterIds } },
      ...(action === "accept"
        ? { $addToSet: { followers: { $each: processRequesterIds } } }
        : {}),
    });

    await User.updateMany(
      { _id: { $in: processRequesterIds } },
      {
        $pull: { pendingFollowRequests: currentUserId },
        ...(action === "accept"
          ? { $addToSet: { following: currentUserId } }
          : {}),
      }
    );

    await appendFollowRequestActions(
      currentUserId,
      processRequesterIds.map((requesterId) => ({
        requester: requesterId,
        actionBy: currentUserId,
        action: action === "accept" ? "accepted" : "rejected",
        source: "bulk",
      }))
    );

    if (action === "accept") {
      const Notification = require("../models/Notification");
      const currentUserName = currentUser?.name || "User";

      await Notification.insertMany(
        processRequesterIds.map((requesterId) => ({
          type: "follow_accepted",
          message: `${currentUserName} accepted your follow request`,
          userId: requesterId,
          user: currentUserId,
        }))
      );
    }

    res.json({
      success: true,
      message:
        action === "accept"
          ? "Follow requests accepted"
          : "Follow requests rejected",
      data: {
        action,
        processed: processRequesterIds.length,
        userIds: processRequesterIds,
        skippedBlockedUserIds: skippedBlockedRequesterIds,
      },
    });
  })
);

// @route   POST /api/users/unfollow/:id
// @desc    Unfollow a user
// @access  Private
router.post(
  "/unfollow/:id",
  asyncHandler(async (req, res) => {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if following
    if (!hasUserId(currentUser.following, req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Not following this user",
      });
    }

    // Remove from following
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.id },
    });

    // Remove from followers
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id },
    });

    res.json({
      success: true,
      message: "User unfollowed successfully",
    });
  })
);

// @route   POST /api/users/remove-follower/:id
// @desc    Remove a follower
// @access  Private
router.post(
  "/remove-follower/:id",
  asyncHandler(async (req, res) => {
    const followerId = req.params.id;
    const currentUserId = req.user.id;

    if (followerId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself as a follower",
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is actually following you
    if (!hasUserId(currentUser.followers, followerId)) {
      return res.status(400).json({
        success: false,
        message: "This user is not following you",
      });
    }

    // Remove from your followers
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followers: followerId },
    });

    // Remove from their following
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: currentUserId },
    });

    res.json({
      success: true,
      message: "Follower removed successfully",
    });
  })
);

// @route   POST /api/users/block/:id
// @desc    Block a user
// @access  Private
router.post(
  "/block/:id",
  asyncHandler(async (req, res) => {
    const userToBlockId = req.params.id;
    const currentUserId = req.user.id;

    if (!isValidObjectId(userToBlockId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (userToBlockId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const userToBlock = await User.findById(userToBlockId);

    if (!currentUser || !userToBlock) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already blocked
    if (hasUserId(currentUser.blockedUsers, userToBlockId)) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    const hadIncomingFollowRequest = hasUserId(
      currentUser.followRequests,
      userToBlockId
    );

    // Add to blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userToBlockId },
      $pull: {
        following: userToBlockId,
        followers: userToBlockId,
        followRequests: userToBlockId,
        pendingFollowRequests: userToBlockId,
      },
    });

    await User.findByIdAndUpdate(userToBlockId, {
      $addToSet: { blockedBy: currentUserId },
      $pull: {
        following: currentUserId,
        followers: currentUserId,
        followRequests: currentUserId,
        pendingFollowRequests: currentUserId,
      },
    });

    if (hadIncomingFollowRequest) {
      await appendFollowRequestActions(currentUserId, [
        {
          requester: userToBlockId,
          actionBy: currentUserId,
          action: "blocked",
          source: "single",
        },
      ]);
    }

    res.json({
      success: true,
      message: "User blocked successfully",
    });
  })
);

// @route   POST /api/users/unblock/:id
// @desc    Unblock a user
// @access  Private
router.post(
  "/unblock/:id",
  asyncHandler(async (req, res) => {
    const userToUnblockId = req.params.id;
    const currentUserId = req.user.id;

    if (!isValidObjectId(userToUnblockId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (userToUnblockId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot unblock yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is blocked
    if (!hasUserId(currentUser.blockedUsers, userToUnblockId)) {
      return res.status(400).json({
        success: false,
        message: "User is not blocked",
      });
    }

    // Remove from blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userToUnblockId },
    });

    await User.findByIdAndUpdate(userToUnblockId, {
      $pull: { blockedBy: currentUserId },
    });

    res.json({
      success: true,
      message: "User unblocked successfully",
    });
  })
);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete(
  "/account",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  })
);

// @route   GET /api/users/username/:username
// @desc    Get user by username with privacy controls
// @access  Private
router.get(
  "/username/:username",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const viewerId = req.user.id;

    const targetUser = await User.findOne({
      username: username.toLowerCase(),
    }).select("-password -emailVerificationToken -passwordResetToken");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if viewer is the profile owner
    const isProfileOwner = viewerId === targetUser._id.toString();

    const viewerUser = isProfileOwner
      ? null
      : await User.findById(viewerId).select("following");

    if (!isProfileOwner && !viewerUser) {
      return res.status(404).json({
        success: false,
        message: "Viewer not found",
      });
    }

    // Check if viewer is a follower
    const isFollower =
      hasUserId(targetUser.followers, viewerId) ||
      hasUserId(viewerUser?.following, targetUser._id);

    // Check if follow request is pending
    const hasFollowRequest = hasUserId(targetUser.followRequests, viewerId);

    // Determine viewer permissions based on privacy settings
    const privacy = targetUser.preferences?.privacy;
    const profileVisibility = privacy?.profileVisibility || "public";

    let canViewProfile = false;
    let canViewPosts = false;
    let canViewFollowers = false;
    let canViewFollowing = false;
    let canMessage = false;
    let canComment = false;

    if (isProfileOwner) {
      // Own profile - full access
      canViewProfile = true;
      canViewPosts = true;
      canViewFollowers = true;
      canViewFollowing = true;
      canMessage = false; // Can't message yourself
      canComment = true;
    } else if (profileVisibility === "public") {
      // Public profile - check individual settings
      canViewProfile = true;
      canViewPosts = privacy?.showPosts === "public" || isFollower;
      canViewFollowers = privacy?.showFollowers !== false;
      canViewFollowing = privacy?.showFollowing !== false;
      canMessage =
        privacy?.allowMessages === "everyone" ||
        (privacy?.allowMessages === "friends" && isFollower);
      canComment =
        privacy?.allowComments === "everyone" ||
        (privacy?.allowComments === "friends" && isFollower);
    } else if (profileVisibility === "private") {
      // Private profile - only followers can see
      canViewProfile = isFollower;
      canViewPosts = isFollower;
      canViewFollowers = isFollower && privacy?.showFollowers !== false;
      canViewFollowing = isFollower && privacy?.showFollowing !== false;
      canMessage = isFollower && privacy?.allowMessages !== "none";
      canComment = isFollower && privacy?.allowComments !== "none";
    } else if (profileVisibility === "friends") {
      // Friends-only profile
      const isFriend = isFollower && hasUserId(targetUser.following, viewerId);
      canViewProfile = isFriend || isFollower;
      canViewPosts = isFriend || isFollower;
      canViewFollowers =
        (isFriend || isFollower) && privacy?.showFollowers !== false;
      canViewFollowing =
        (isFriend || isFollower) && privacy?.showFollowing !== false;
      canMessage =
        (isFriend || isFollower) && privacy?.allowMessages !== "none";
      canComment =
        (isFriend || isFollower) && privacy?.allowComments !== "none";
    }

    // Apply privacy controls
    let userData = targetUser.toObject();

    // If can't view profile, return limited data
    if (!canViewProfile) {
      const limitedProfile = {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture,
        role: targetUser.role,
        subscription: targetUser.subscription,
        profile: {
          bio: targetUser.profile?.bio,
        },
        followers: [],
        following: [],
        followerCount: targetUser.followers?.length || 0,
        followingCount: targetUser.following?.length || 0,
        postCount: targetUser.posts?.length || 0,
        isPrivate: profileVisibility === "private",
        hasFollowRequest,
      };

      return res.json({
        success: true,
        data: {
          user: limitedProfile,
          viewerPermissions: {
            isProfileOwner,
            isFollower,
            canViewProfile: false,
            canViewPosts: false,
            canViewFollowers: false,
            canViewFollowing: false,
            canMessage: false,
            canComment: false,
            hasFollowRequest,
            canFollow: !isProfileOwner && !isFollower && !hasFollowRequest,
          },
        },
      });
    }

    // Hide sensitive information based on privacy settings
    if (!isProfileOwner) {
      // Hide email if not public
      if (!targetUser.preferences?.privacy?.showEmail) {
        delete userData.email;
      }

      // Hide phone if not public
      if (!targetUser.preferences?.privacy?.showPhone) {
        delete userData.profile?.mobileNumber;
      }

      // Hide followers/following based on settings
      if (targetUser.preferences?.privacy?.showFollowers === false) {
        delete userData.followers;
        userData.followersCount = 0;
      }

      if (targetUser.preferences?.privacy?.showFollowing === false) {
        delete userData.following;
        userData.followingCount = 0;
      }

      // Hide online status if not public
      if (!targetUser.preferences?.privacy?.showOnlineStatus) {
        delete userData.isOnline;
        delete userData.lastSeen;
      }

      // Hide last seen if not public
      if (!targetUser.preferences?.privacy?.showLastSeen) {
        delete userData.lastSeen;
      }
    }

    res.json({
      success: true,
      data: {
        user: userData,
        viewerPermissions: {
          isProfileOwner,
          isFollower,
          canViewProfile,
          canViewPosts,
          canViewFollowers,
          canViewFollowing,
          canMessage,
          canComment,
          hasFollowRequest,
          canFollow: !isProfileOwner && !isFollower && !hasFollowRequest,
        },
      },
    });
  })
);

// Helper function to check message permissions
const checkMessagePermission = (targetUser, viewerId) => {
  const allowMessages =
    targetUser.preferences?.privacy?.allowMessages || "everyone";

  if (allowMessages === "everyone") return true;
  if (allowMessages === "friends" && hasUserId(targetUser.followers, viewerId))
    return true;
  if (allowMessages === "none") return false;

  return false;
};

// Helper function to check comment permissions
const checkCommentPermission = (targetUser, viewerId) => {
  const allowComments =
    targetUser.preferences?.privacy?.allowComments || "everyone";

  if (allowComments === "everyone") return true;
  if (allowComments === "friends" && hasUserId(targetUser.followers, viewerId))
    return true;
  if (allowComments === "none") return false;

  return false;
};

// Voice model definitions
const AVAILABLE_VOICE_MODELS = [
  // Indian Female Voices
  { id: "en-IN-female-1", name: "Aria (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
  { id: "en-IN-female-2", name: "Kavya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
  { id: "en-IN-female-3", name: "Priya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
  { id: "en-IN-female-4", name: "Shreya (Indian Female)", lang: "en-IN", gender: "female", country: "India" },
  
  // Indian Male Voices
  { id: "en-IN-male-1", name: "Arjun (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
  { id: "en-IN-male-2", name: "Vikram (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
  { id: "en-IN-male-3", name: "Rohit (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
  { id: "en-IN-male-4", name: "Aditya (Indian Male)", lang: "en-IN", gender: "male", country: "India" },
  
  // US Voices
  { id: "en-US-female-1", name: "Sarah (US Female)", lang: "en-US", gender: "female", country: "US" },
  { id: "en-US-male-1", name: "David (US Male)", lang: "en-US", gender: "male", country: "US" },
  
  // UK Voices
  { id: "en-GB-female-1", name: "Emma (UK Female)", lang: "en-GB", gender: "female", country: "UK" },
  { id: "en-GB-male-1", name: "Oliver (UK Male)", lang: "en-GB", gender: "male", country: "UK" },
];

// @route   GET /api/users/ai-companion/voice-models
// @desc    Get available voice models
// @access  Private
router.get(
  "/ai-companion/voice-models",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { voiceModels: AVAILABLE_VOICE_MODELS },
    });
  })
);

// @route   GET /api/users/ai-companion/settings
// @desc    Get AI companion settings
// @access  Private
router.get(
  "/ai-companion/settings",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("+aiCompanion.geminiApiKey");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const settings = {
      selectedVoiceModel: user.aiCompanion?.selectedVoiceModel || "en-IN-female-1",
      voicePreferences: user.aiCompanion?.voicePreferences || {
        rate: 1,
        pitch: 1,
        volume: 1,
      },
      hasApiKey: !!user.aiCompanion?.geminiApiKey,
      isApiKeyValid: user.aiCompanion?.isApiKeyValid || false,
      lastApiKeyValidation: user.aiCompanion?.lastApiKeyValidation,
    };

    res.json({
      success: true,
      data: { settings },
    });
  })
);

// @route   POST /api/users/ai-companion/api-key
// @desc    Set and validate Gemini API key
// @access  Private
router.post(
  "/ai-companion/api-key",
  [
    body("apiKey")
      .notEmpty()
      .withMessage("API key is required")
      .isLength({ min: 10 })
      .withMessage("Invalid API key format"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { apiKey } = req.body;

    // Validate API key 
    let isValid = false;
    let validationError = null;
    
    try {
      // Basic format validation
      if (!apiKey.startsWith('AIzaSy')) {
        throw new Error('Invalid API key format - must start with AIzaSy');
      }
      
      if (apiKey.length < 39) {
        throw new Error('Invalid API key format - too short');
      }
      
      logger.info('Attempting to validate API key:', apiKey.substring(0, 15) + '...');
      
      // For development/testing, you can skip actual API validation by setting NODE_ENV
      if (process.env.NODE_ENV === 'development' && process.env.SKIP_API_VALIDATION === 'true') {
        logger.info('Skipping API validation in development mode');
        isValid = true;
      } else {
        // Perform actual API validation
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        
        // Test the API key with a simple prompt and timeout
        const result = await Promise.race([
          model.generateContent("Test"),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout - please try again')), 15000)
          )
        ]);
        
        const response = result.response;
        const text = response.text();
        
        if (text && text.length > 0) {
          isValid = true;
          logger.info('API key validation successful');
        } else {
          throw new Error('Empty response from Gemini API');
        }
      }
    } catch (error) {
      logger.error("API key validation failed:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n')[0]
      });
      
      isValid = false;
      
      // Enhanced error handling with more specific messages
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('api_key_invalid') || 
          errorMessage.includes('invalid api key') ||
          errorMessage.includes('403') ||
          error.status === 403) {
        validationError = 'Invalid API key. Please verify your Gemini API key from Google AI Studio.';
      } else if (errorMessage.includes('quota') || 
                 errorMessage.includes('429') ||
                 error.status === 429) {
        validationError = 'API quota exceeded. Please check your Google AI Studio usage limits.';
      } else if (errorMessage.includes('permission') || 
                 errorMessage.includes('401') ||
                 error.status === 401) {
        validationError = 'API key lacks permission. Please ensure Gemini API access is enabled.';
      } else if (errorMessage.includes('timeout')) {
        validationError = 'Validation timeout. Please check your connection and try again.';
      } else if (errorMessage.includes('network') || 
                 errorMessage.includes('enotfound') ||
                 errorMessage.includes('econnrefused')) {
        validationError = 'Network error. Please check your internet connection.';
      } else if (errorMessage.includes('format')) {
        validationError = error.message;
      } else {
        validationError = 'API key validation failed. Please verify your key and try again.';
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: validationError || "Invalid API key. Please check your Gemini API key.",
      });
    }

    // Update user with validated API key
    await User.findByIdAndUpdate(req.user.id, {
      "aiCompanion.geminiApiKey": apiKey,
      "aiCompanion.isApiKeyValid": true,
      "aiCompanion.lastApiKeyValidation": new Date(),
    });

    res.json({
      success: true,
      message: "API key validated and saved successfully",
    });
  })
);

// @route   PUT /api/users/ai-companion/voice-model
// @desc    Update selected voice model
// @access  Private
router.put(
  "/ai-companion/voice-model",
  [
    body("voiceModelId")
      .notEmpty()
      .withMessage("Voice model ID is required")
      .custom((value) => {
        const validIds = AVAILABLE_VOICE_MODELS.map(model => model.id);
        if (!validIds.includes(value)) {
          throw new Error("Invalid voice model ID");
        }
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { voiceModelId } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      "aiCompanion.selectedVoiceModel": voiceModelId,
    });

    const selectedVoice = AVAILABLE_VOICE_MODELS.find(model => model.id === voiceModelId);

    res.json({
      success: true,
      message: "Voice model updated successfully",
      data: { selectedVoice },
    });
  })
);

// @route   PUT /api/users/ai-companion/voice-preferences
// @desc    Update voice preferences (rate, pitch, volume)
// @access  Private
router.put(
  "/ai-companion/voice-preferences",
  [
    body("rate")
      .optional()
      .isFloat({ min: 0.1, max: 10 })
      .withMessage("Rate must be between 0.1 and 10"),
    body("pitch")
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage("Pitch must be between 0 and 2"),
    body("volume")
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage("Volume must be between 0 and 1"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { rate, pitch, volume } = req.body;
    const updateData = {};

    if (rate !== undefined) updateData["aiCompanion.voicePreferences.rate"] = rate;
    if (pitch !== undefined) updateData["aiCompanion.voicePreferences.pitch"] = pitch;
    if (volume !== undefined) updateData["aiCompanion.voicePreferences.volume"] = volume;

    await User.findByIdAndUpdate(req.user.id, updateData);

    res.json({
      success: true,
      message: "Voice preferences updated successfully",
    });
  })
);

// @route   DELETE /api/users/ai-companion/api-key
// @desc    Remove API key
// @access  Private
router.delete(
  "/ai-companion/api-key",
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: {
        "aiCompanion.geminiApiKey": "",
      },
      "aiCompanion.isApiKeyValid": false,
      "aiCompanion.lastApiKeyValidation": null,
    });

    res.json({
      success: true,
      message: "API key removed successfully",
    });
  })
);

// @route   POST /api/users/ai-companion/validate-api-key
// @desc    Validate existing API key
// @access  Private
router.post(
  "/ai-companion/validate-api-key",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("+aiCompanion.geminiApiKey");

    if (!user || !user.aiCompanion?.geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "No API key found. Please set your API key first.",
      });
    }

    const apiKey = user.aiCompanion.geminiApiKey;

    // Validate API key
    let isValid = false;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      
      const result = await model.generateContent("Hello, this is a test.");
      const response = await result.response;
      
      if (response && response.text) {
        isValid = true;
      }
    } catch (error) {
      logger.error("API key validation failed:", error);
      isValid = false;
    }

    // Update validation status
    await User.findByIdAndUpdate(req.user.id, {
      "aiCompanion.isApiKeyValid": isValid,
      "aiCompanion.lastApiKeyValidation": new Date(),
    });

    res.json({
      success: true,
      isValid,
      message: isValid ? "API key is valid" : "API key is invalid. Please update your API key.",
    });
  })
);

module.exports = router;
