const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyTokenMiddleware, requireRole } = require("../utils/jwtUtils");
const { authenticateToken } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyTokenMiddleware);

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
    body("preferences.privacy.showProgress")
      .optional()
      .isBoolean()
      .withMessage("Show progress must be a boolean"),
    body("preferences.theme")
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

    if (req.body.preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...req.body.preferences,
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
      .select("followRequests");

    res.json({
      success: true,
      data: { followRequests: currentUser.followRequests || [] },
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
    const isFollowing =
      currentUser.following && currentUser.following.includes(targetUserId);
    const hasFollowRequest =
      targetUser.followRequests &&
      targetUser.followRequests.includes(currentUserId);
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
    const isFollowing =
      currentUser.following && currentUser.following.includes(targetUserId);
    const hasFollowRequest =
      targetUser.followRequests &&
      targetUser.followRequests.includes(currentUserId);
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

    // Check if already following
    if (
      currentUser.following &&
      currentUser.following.includes(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // Check if follow request already sent
    if (
      userToFollow.followRequests &&
      userToFollow.followRequests.includes(req.user.id)
    ) {
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

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if follow request exists
    if (!currentUser.followRequests.includes(requesterId)) {
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

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if follow request exists
    if (!currentUser.followRequests.includes(requesterId)) {
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

    res.json({
      success: true,
      message: "Follow request rejected",
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
    if (
      !currentUser.following ||
      !currentUser.following.includes(req.params.id)
    ) {
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
    if (!currentUser.followers || !currentUser.followers.includes(followerId)) {
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
    if (
      currentUser.blockedUsers &&
      currentUser.blockedUsers.includes(userToBlockId)
    ) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    // Add to blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userToBlockId },
    });

    // Remove from following/followers if they exist
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userToBlockId, followers: userToBlockId },
    });

    await User.findByIdAndUpdate(userToBlockId, {
      $pull: { following: currentUserId, followers: currentUserId },
    });

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
    if (
      !currentUser.blockedUsers ||
      !currentUser.blockedUsers.includes(userToUnblockId)
    ) {
      return res.status(400).json({
        success: false,
        message: "User is not blocked",
      });
    }

    // Remove from blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userToUnblockId },
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

    // Check if viewer is a follower
    const isFollower = targetUser.followers.includes(viewerId);

    // Check if follow request is pending
    const hasFollowRequest = targetUser.followRequests.includes(viewerId);

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
      const isFriend =
        targetUser.followers.includes(viewerId) &&
        targetUser.following.includes(viewerId);
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
  if (allowMessages === "friends" && targetUser.followers.includes(viewerId))
    return true;
  if (allowMessages === "none") return false;

  return false;
};

// Helper function to check comment permissions
const checkCommentPermission = (targetUser, viewerId) => {
  const allowComments =
    targetUser.preferences?.privacy?.allowComments || "everyone";

  if (allowComments === "everyone") return true;
  if (allowComments === "friends" && targetUser.followers.includes(viewerId))
    return true;
  if (allowComments === "none") return false;

  return false;
};

module.exports = router;
