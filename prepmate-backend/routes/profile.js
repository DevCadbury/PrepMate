const express = require("express");
const { body, validationResult } = require("express-validator");
const { asyncHandler } = require("../utils/asyncHandler");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");
const Post = require("../models/Post");
const cloudinary = require("cloudinary").v2;
const logger = require("../utils/logger");

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Get user profile
// @route   GET /api/profile/:userId
// @access  Public
router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("followers", "name username profilePicture")
      .populate("following", "name username profilePicture");

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

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
router.put(
  "/",
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
    body("profile.socialLinks.linkedin")
      .optional()
      .isLength({ max: 200 })
      .withMessage("LinkedIn URL cannot exceed 200 characters"),
    body("profile.socialLinks.github")
      .optional()
      .isLength({ max: 200 })
      .withMessage("GitHub URL cannot exceed 200 characters"),
    body("profile.socialLinks.portfolio")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Portfolio URL cannot exceed 200 characters"),
  ],
  asyncHandler(async (req, res) => {
    try {
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

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

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
    } catch (error) {
      logger.error("Error updating profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  })
);

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
router.post(
  "/upload-picture",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Image URL is required",
        });
      }

      // Update user's profile picture
      const user = await User.findById(req.user.id);
      user.profilePicture = imageUrl;
      await user.save();

      res.json({
        success: true,
        message: "Profile picture updated successfully",
        data: {
          profilePicture: imageUrl,
        },
      });
    } catch (error) {
      logger.error("Error uploading profile picture:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload profile picture",
      });
    }
  })
);

// @desc    Get user posts
// @route   GET /api/profile/:userId/posts
// @access  Public
router.get(
  "/:userId/posts",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ user: req.params.userId });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: skip + posts.length < total,
          hasPrev: page > 1,
        },
      },
    });
  })
);

// @desc    Get user followers
// @route   GET /api/profile/:userId/followers
// @access  Public
router.get(
  "/:userId/followers",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).populate(
      "followers",
      "name username profilePicture email role"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        followers: user.followers || [],
      },
    });
  })
);

// @desc    Get user following
// @route   GET /api/profile/:userId/following
// @access  Public
router.get(
  "/:userId/following",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).populate(
      "following",
      "name username profilePicture email role"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        following: user.following || [],
      },
    });
  })
);

// @desc    Get user stats
// @route   GET /api/profile/:userId/stats
// @access  Public
router.get(
  "/:userId/stats",
  asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    const [
      posts,
      followers,
      following,
      profileViews,
      totalLikes,
      totalComments,
    ] = await Promise.all([
      Post.countDocuments({ user: userId }),
      User.findById(userId).then((user) => user?.followers?.length || 0),
      User.findById(userId).then((user) => user?.following?.length || 0),
      User.findById(userId).then((user) => user?.metrics?.profileViews || 0),
      Post.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: "$likes" } } },
      ]).then((result) => result[0]?.total || 0),
      Post.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: "$comments" } } },
      ]).then((result) => result[0]?.total || 0),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          posts,
          followers,
          following,
          profileViews,
          totalLikes,
          totalComments,
        },
      },
    });
  })
);

module.exports = router;
