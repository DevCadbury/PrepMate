const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
// Removed asyncHandler dependency
const { authenticateToken } = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const logger = require("../utils/logger");

// Simple language detection function
const detectLanguage = (code) => {
  const codeLower = code.toLowerCase();
  if (
    codeLower.includes("function") ||
    codeLower.includes("const") ||
    codeLower.includes("let") ||
    codeLower.includes("var")
  ) {
    return "javascript";
  } else if (
    codeLower.includes("def ") ||
    codeLower.includes("import ") ||
    codeLower.includes("print(")
  ) {
    return "python";
  } else if (
    codeLower.includes("public class") ||
    codeLower.includes("public static") ||
    codeLower.includes("System.out")
  ) {
    return "java";
  } else if (
    codeLower.includes("<?php") ||
    codeLower.includes("echo ") ||
    codeLower.includes("$")
  ) {
    return "php";
  } else if (codeLower.includes("function") && codeLower.includes("=>")) {
    return "typescript";
  } else if (
    codeLower.includes("html") ||
    codeLower.includes("<div>") ||
    codeLower.includes("<span>")
  ) {
    return "html";
  } else if (codeLower.includes("css") || codeLower.includes("{")) {
    return "css";
  } else {
    return "javascript"; // default
  }
};

const router = express.Router();

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveUploadedMediaType = (mimetype = "") => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

const resolveCloudinaryResourceType = (mediaType) => {
  if (mediaType === "image") return "image";
  if (mediaType === "video" || mediaType === "audio") return "video";
  return "raw";
};

const hasUserId = (list, userId) => {
  if (!Array.isArray(list) || !userId) return false;
  const target = userId.toString();
  return list.some((id) => id.toString() === target);
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const appendFollowRequestAction = async ({
  ownerId,
  requesterId,
  actionBy,
  action,
  source = "single",
}) => {
  if (
    !ownerId ||
    !requesterId ||
    !actionBy ||
    !["accepted", "rejected", "blocked"].includes(action)
  ) {
    return;
  }

  await User.findByIdAndUpdate(ownerId, {
    $push: {
      followRequestActions: {
        $each: [
          {
            requester: requesterId,
            actionBy,
            action,
            source: source === "bulk" ? "bulk" : "single",
            createdAt: new Date(),
          },
        ],
        $slice: -200,
      },
    },
  });
};

const isBlockedBetweenUsers = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  const currentUserId = currentUser._id || currentUser.id;
  const targetUserId = targetUser._id || targetUser.id;

  return (
    hasUserId(currentUser.blockedUsers, targetUserId) ||
    hasUserId(currentUser.blockedBy, targetUserId) ||
    hasUserId(targetUser.blockedUsers, currentUserId) ||
    hasUserId(targetUser.blockedBy, currentUserId)
  );
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("audio/") ||
      DOCUMENT_MIME_TYPES.has(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, audio, and document files are allowed"), false);
    }
  },
});

// @desc    Create a test post (for debugging)
// @route   POST /api/social/posts/test
// @access  Private
router.post("/posts/test", authenticateToken, async (req, res) => {
  try {
    console.log("=== CREATING TEST POST ===");
    console.log("User:", req.user);

    const testPost = new Post({
      user: req.user.id,
      content: "This is a test post to check if the feed is working!",
      type: "text",
      visibility: "public",
      category: "general",
    });

    await testPost.save();
    await testPost.populate("user", "name username profilePicture");

    console.log("Test post created:", testPost);

    res.status(201).json({
      success: true,
      message: "Test post created successfully",
      data: { post: testPost },
    });
  } catch (error) {
    console.error("Error creating test post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Create a new post
// @route   POST /api/social/posts
// @access  Private
router.post(
  "/posts",
  authenticateToken,
  upload.array("media", 10), // Allow up to 10 media files
  [
    body("content")
      .trim()
      .isLength({ min: 0, max: 5000 })
      .withMessage("Post content must be between 0 and 5000 characters")
      .custom((value) => {
        console.log("=== CONTENT VALIDATION ===");
        console.log("Content value:", value);
        console.log("Content type:", typeof value);
        console.log("Content length:", value ? value.length : 0);
        console.log("Content trimmed:", value ? value.trim() : "");
        console.log("Content trimmed length:", value ? value.trim().length : 0);
        return true;
      }),
    body("type")
      .optional()
      .isIn([
        "text",
        "code",
        "media",
        "image",
        "video",
        "link",
        "poll",
        "question",
        "achievement",
        "resource",
        "interview",
        "roadmap",
      ])
      .withMessage("Invalid post type"),
    body("visibility")
      .optional()
      .isIn(["public", "friends", "private"])
      .withMessage("Invalid visibility setting"),
    body("tags")
      .optional()
      .custom((value) => {
        // Handle both array and JSON string formats
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length <= 10) {
              return true;
            }
          } catch (error) {
            return false;
          }
        } else if (Array.isArray(value) && value.length <= 10) {
          return true;
        }
        throw new Error("Tags must be an array with maximum 10 items");
      })
      .withMessage("Maximum 10 tags allowed"),
    body("hashtags")
      .optional()
      .custom((value) => {
        // Handle both array and JSON string formats
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length <= 20) {
              return true;
            }
          } catch (error) {
            return false;
          }
        } else if (Array.isArray(value) && value.length <= 20) {
          return true;
        }
        throw new Error("Hashtags must be an array with maximum 20 items");
      })
      .withMessage("Maximum 20 hashtags allowed"),
  ],
  async (req, res, next) => {
    // Custom validation: either content or media must be provided
    const { content } = req.body;
    const hasMedia = req.files && req.files.length > 0;

    console.log("=== CUSTOM VALIDATION ===");
    console.log("Content:", content);
    console.log("Content length:", content ? content.length : 0);
    console.log("Content trimmed:", content ? content.trim() : "");
    console.log("Has media:", hasMedia);
    console.log("Files:", req.files);

    if (!content || content.trim() === "") {
      if (!hasMedia) {
        console.log("Validation failed: No content and no media");
        return res.status(400).json({
          success: false,
          message: "Either content or media must be provided",
        });
      }
    }

    // Validate content to prevent JSX/HTML code from being submitted
    if (content && content.trim()) {
      // Only check for JSX/HTML in non-code posts
      const postType = req.body.type || "text";
      if (postType !== "code") {
        const jsxPattern =
          /<[A-Z][a-zA-Z]*\s|className=|onClick=|onChange=|useState|useEffect|import\s|export\s|function\s|const\s|let\s|var\s/;
        if (jsxPattern.test(content)) {
          console.log("Validation failed: JSX/HTML code detected in content");
          return res.status(400).json({
            success: false,
            message:
              "Please don't paste code or JSX. Write your thoughts in plain text.",
          });
        }
      }
    }

    console.log("Custom validation passed");
    next();
  },
  async (req, res) => {
    try {
      console.log("=== CREATING POST ===");
      console.log("Request body:", req.body);
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Content from body:", req.body.content);
      console.log("Content type:", typeof req.body.content);
      console.log(
        "Content length:",
        req.body.content ? req.body.content.length : 0
      );
      console.log("Files:", req.files);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        content,
        type = "text",
        visibility = "public",
        tags = [],
        hashtags = [],
        mentions = [],
        location,
        category = "general",
        poll,
        metadata,
      } = req.body;

      // Parse tags if they come as JSON string
      let parsedTags = tags;
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch (error) {
          parsedTags = [];
        }
      }

      let parsedHashtags = hashtags;
      if (typeof hashtags === "string") {
        try {
          parsedHashtags = JSON.parse(hashtags);
        } catch (error) {
          parsedHashtags = [];
        }
      }

      let parsedMentions = mentions;
      if (typeof mentions === "string") {
        try {
          parsedMentions = JSON.parse(mentions);
        } catch (error) {
          parsedMentions = [];
        }
      }

      if (!Array.isArray(parsedMentions)) {
        parsedMentions = [];
      }

      if (parsedMentions.length === 0 && type !== "code" && typeof content === "string") {
        parsedMentions = Array.from(
          new Set((content.match(/@([a-zA-Z0-9_]{2,30})/g) || []).map((value) => value.slice(1)))
        );
      }

      // Upload media files to Cloudinary if any
      const media = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const mediaType = resolveUploadedMediaType(file.mimetype);
            const resourceType = resolveCloudinaryResourceType(mediaType);

            const uploadOptions = {
              folder: "prepmate/posts",
              resource_type: resourceType,
            };

            if (mediaType === "image" || mediaType === "video") {
              uploadOptions.transformation = [
                { width: 1200, height: 1200, crop: "limit" },
                { quality: "auto" },
              ];
            }

            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
              uploadOptions
            );

            media.push({
              url: result.secure_url,
              type: mediaType,
              thumbnail:
                mediaType === "image" || mediaType === "video"
                  ? result.secure_url
                  : undefined,
              size: file.size,
              filename: file.originalname,
              cloudinaryId: result.public_id,
            });
          } catch (error) {
            logger.error("Error uploading media to Cloudinary:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to upload media",
            });
          }
        }
      }

      // Process mentions
      const mentionUsers = [];
      if (parsedMentions && parsedMentions.length > 0) {
        for (const mentionRaw of parsedMentions) {
          const mention = String(mentionRaw || "").replace(/^@/, "").trim();
          if (!mention) {
            continue;
          }

          const escapedMention = escapeRegExp(mention);
          const user = await User.findOne({
            $or: [
              { username: new RegExp(`^${escapedMention}$`, "i") },
              { name: new RegExp(`^${escapedMention}$`, "i") },
            ],
          });
          if (user) {
            mentionUsers.push(user._id);
          }
        }
      }

      // Process code snippets if type is code
      let codeSnippets = [];
      if (type === "code" && content) {
        try {
          // Try to parse content as JSON for structured code snippets
          const parsedContent = JSON.parse(content);
          if (Array.isArray(parsedContent)) {
            codeSnippets = parsedContent;
          } else if (parsedContent.code) {
            codeSnippets = [parsedContent];
          }
        } catch (error) {
          // If not JSON, treat as plain code with language detection
          const detectedLanguage = detectLanguage(content);
          codeSnippets = [
            {
              language: detectedLanguage,
              code: content,
              filename: "code.js",
            },
          ];
        }
      }

      const normalizedContent = typeof content === "string" ? content.trim() : "";
      const primarySnippet = Array.isArray(codeSnippets) ? codeSnippets[0] : null;
      const snippetDescription =
        typeof primarySnippet?.description === "string"
          ? primarySnippet.description.trim()
          : "";
      const snippetLanguage =
        typeof primarySnippet?.language === "string" && primarySnippet.language.trim()
          ? primarySnippet.language.trim().toLowerCase()
          : "code";

      // Keep content populated for schema compatibility and better feed previews.
      let postContent = normalizedContent;
      if (type === "code") {
        postContent = snippetDescription || `Shared a ${snippetLanguage} snippet`;
      } else if (!postContent && media.length > 0) {
        postContent = "Shared media";
      }

      // Create the post
      const post = new Post({
        user: req.user.id,
        content: postContent,
        type,
        media,
        codeSnippets: codeSnippets.length > 0 ? codeSnippets : undefined,
        visibility,
        tags: (Array.isArray(parsedTags) ? parsedTags : []).map((tag) =>
          String(tag).toLowerCase().trim()
        ),
        hashtags: (Array.isArray(parsedHashtags) ? parsedHashtags : []).map((hashtag) =>
          String(hashtag).toLowerCase().trim()
        ),
        mentions: mentionUsers,
        location,
        category,
        poll: poll ? JSON.parse(poll) : undefined,
        metadata: metadata ? JSON.parse(metadata) : undefined,
      });

      await post.save();

      // Populate user data
      await post.populate("user", "name username profilePicture");
      await post.populate("mentions", "name username profilePicture");

      const uniqueMentionUserIds = Array.from(
        new Set(mentionUsers.map((id) => id.toString()))
      ).filter((id) => id !== req.user.id.toString());

      if (uniqueMentionUserIds.length > 0) {
        try {
          await Notification.insertMany(
            uniqueMentionUserIds.map((mentionedUserId) => ({
              type: "mention",
              category: "social",
              message: `${req.user.name} mentioned you in a post`,
              userId: mentionedUserId,
              user: req.user.id,
              postId: post._id,
              metadata: {
                postId: post._id,
                postType: post.type,
              },
            }))
          );
        } catch (notificationError) {
          logger.error("Failed to create mention notifications:", notificationError);
        }
      }

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Get follow status between current user and target user
// @route   GET /api/social/users/:userId/follow-status
// @access  Private
router.get(
  "/users/:userId/follow-status",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;

      // Prevent checking own follow status
      if (userId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: "Cannot check follow status with yourself",
        });
      }

      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId),
      ]);

      if (!currentUser || !targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (isBlockedBetweenUsers(currentUser, targetUser)) {
        return res.json({
          success: true,
          data: {
            isFollowing: false,
            isFollower: false,
            hasRequestSent: false,
            canFollow: false,
            relationshipStatus: "blocked",
            buttonText: "Blocked",
            isPrivateAccount: false,
            privacy: targetUser.preferences?.privacy,
          },
        });
      }

      const isFollowing = hasUserId(currentUser.following, userId);
      const isFollower =
        hasUserId(targetUser.followers, currentUserId) || isFollowing;
      const hasRequestSent = hasUserId(targetUser.followRequests, currentUserId);
      const isPrivateAccount =
        targetUser.preferences?.privacy?.profileVisibility === "private";

      // Determine the relationship status
      let relationshipStatus = "none";
      let canFollow = true;
      let buttonText = "Follow";

      if (isFollowing) {
        relationshipStatus = "following";
        canFollow = false;
        buttonText = "Unfollow";
      } else if (hasRequestSent) {
        relationshipStatus = "requested";
        canFollow = false;
        buttonText = "Requested";
      } else if (isPrivateAccount) {
        relationshipStatus = "private";
        canFollow = true;
        buttonText = "Follow";
      } else {
        relationshipStatus = "public";
        canFollow = true;
        buttonText = "Follow";
      }

      res.json({
        success: true,
        data: {
          isFollowing,
          isFollower,
          hasRequestSent: hasRequestSent,
          canFollow,
          relationshipStatus,
          buttonText,
          isPrivateAccount,
          privacy: targetUser.preferences?.privacy,
        },
      });
    } catch (error) {
      console.error("Error getting follow status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Follow a user
// @route   POST /api/social/users/:userId/follow
// @access  Private
router.post("/users/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    // Prevent self-following
    if (userId === followerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(followerId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (isBlockedBetweenUsers(currentUser, userToFollow)) {
      return res.status(403).json({
        success: false,
        message: "You cannot follow this user because one of you has blocked the other",
      });
    }

    // Check if already following
    if (hasUserId(currentUser.following, userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
        data: {
          isFollowing: true,
          relationshipStatus: "following",
        },
      });
    }

    // Check if follow request already sent
    if (hasUserId(userToFollow.followRequests, followerId)) {
      return res.status(400).json({
        success: false,
        message: "Follow request already sent",
        data: {
          hasRequestSent: true,
          relationshipStatus: "requested",
        },
      });
    }

    const isPrivateAccount =
      userToFollow.preferences?.privacy?.profileVisibility === "private";

    if (isPrivateAccount) {
      // For private accounts, add to follow requests instead of following directly
      if (!userToFollow.followRequests) {
        userToFollow.followRequests = [];
      }
      if (!hasUserId(userToFollow.followRequests, followerId)) {
        userToFollow.followRequests.push(followerId);
      }
      await userToFollow.save();

      res.json({
        success: true,
        message: "Follow request sent successfully",
        data: {
          hasRequestSent: true,
          relationshipStatus: "requested",
          isPrivateAccount: true,
        },
      });
    } else {
      // For public accounts, follow directly
      if (!hasUserId(currentUser.following, userId)) {
        currentUser.following.push(userId);
      }
      await currentUser.save();

      if (!hasUserId(userToFollow.followers, followerId)) {
        userToFollow.followers.push(followerId);
      }
      await userToFollow.save();

      res.json({
        success: true,
        message: "Successfully followed user",
        data: {
          isFollowing: true,
          relationshipStatus: "following",
          following: currentUser.following,
          followers: userToFollow.followers,
        },
      });
    }
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Unfollow a user
// @route   DELETE /api/social/users/:userId/follow
// @access  Private
router.delete("/users/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(followerId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (isBlockedBetweenUsers(currentUser, userToUnfollow)) {
      return res.status(403).json({
        success: false,
        message: "You cannot interact with this user because one of you has blocked the other",
      });
    }

    // Check if following
    const isFollowing = hasUserId(currentUser.following, userId);
    // Check if follow request sent
    const hasRequestSent = hasUserId(userToUnfollow.followRequests, followerId);

    if (!isFollowing && !hasRequestSent) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user and have no pending request",
        data: {
          isFollowing: false,
          hasRequestSent: false,
          relationshipStatus: "none",
        },
      });
    }

    if (isFollowing) {
      // Remove from following list
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userId
      );
      await currentUser.save();

      // Remove from user's followers list
      userToUnfollow.followers = userToUnfollow.followers.filter(
        (id) => id.toString() !== followerId
      );
      await userToUnfollow.save();

      res.json({
        success: true,
        message: "Successfully unfollowed user",
        data: {
          isFollowing: false,
          relationshipStatus: "none",
          following: currentUser.following,
          followers: userToUnfollow.followers,
        },
      });
    } else if (hasRequestSent) {
      // Cancel follow request
      userToUnfollow.followRequests = userToUnfollow.followRequests.filter(
        (id) => id.toString() !== followerId
      );
      await userToUnfollow.save();

      res.json({
        success: true,
        message: "Follow request cancelled successfully",
        data: {
          hasRequestSent: false,
          relationshipStatus: "none",
        },
      });
    }
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Debug: Get all posts (for testing)
// @route   GET /api/social/posts/debug
// @access  Private
router.get("/posts/debug", authenticateToken, async (req, res) => {
  try {
    console.log("=== DEBUG: GETTING ALL POSTS ===");

    const allPosts = await Post.find({})
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 });

    console.log("Total posts in database:", allPosts.length);
    console.log(
      "Posts with user info:",
      allPosts.map((p) => ({
        id: p._id,
        content: p.content,
        user: p.user?._id || p.user,
        userName: p.user?.name || "Unknown",
      }))
    );

    res.json({
      success: true,
      data: {
        totalPosts: allPosts.length,
        posts: allPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching debug posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Debug: Get posts for specific user (for testing)
// @route   GET /api/social/posts/debug/user/:userId
// @access  Private
router.get("/posts/debug/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("=== DEBUG: GETTING POSTS FOR USER ===");
    console.log("User ID:", userId);

    const posts = await Post.find({ user: userId })
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 });

    console.log("Posts found for user:", posts.length);
    console.log(
      "Posts with user info:",
      posts.map((p) => ({
        id: p._id,
        content: p.content,
        user: p.user?._id || p.user,
        userName: p.user?.name || "Unknown",
      }))
    );

    res.json({
      success: true,
      data: {
        userId,
        totalPosts: posts.length,
        posts: posts,
      },
    });
  } catch (error) {
    console.error("Error fetching debug user posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get feed posts (posts from followed users + own posts)
// @route   GET /api/social/posts/feed
// @access  Private
router.get("/posts/feed", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    console.log("=== GETTING FEED POSTS ===");
    console.log("User ID:", userId);
    console.log("Page:", page);
    console.log("Limit:", limit);

    // Get current user to find followed users and block filters.
    const currentUser = await User.findById(userId).select(
      "following blockedUsers blockedBy"
    );
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    const candidateAuthorIds = Array.from(
      new Set([...(currentUser.following || []).map((id) => id.toString()), userId])
    );

    const candidateAuthors = await User.find({
      _id: { $in: candidateAuthorIds },
    }).select("_id preferences.privacy blockedUsers blockedBy");

    const allowedAuthorIds = candidateAuthors
      .filter((author) => {
        const isOwnPostAuthor = author._id.toString() === userId.toString();
        if (isOwnPostAuthor) return true;

        const isBlocked = isBlockedBetweenUsers(currentUser, author);
        if (isBlocked) return false;

        const profileVisibility =
          author.preferences?.privacy?.profileVisibility || "public";
        if (profileVisibility === "private") {
          return hasUserId(currentUser.following, author._id);
        }

        return true;
      })
      .map((author) => author._id);

    const rawPosts = await Post.find({
      user: { $in: allowedAuthorIds },
      status: "active",
    })
      .populate("user", "name username profilePicture")
      .populate("comments.user", "name username profilePicture")
      .populate("comments.replies.user", "name username profilePicture")
      .sort({ createdAt: -1 })
      .limit(parsedLimit * 3)
      .skip((parsedPage - 1) * parsedLimit);

    const posts = rawPosts
      .filter((post) => {
        const isOwnPost = post.user?._id?.toString() === userId.toString();
        if (isOwnPost) return true;

        if (post.visibility === "public") return true;
        if (post.visibility === "friends" || post.visibility === "private") {
          return hasUserId(currentUser.following, post.user?._id);
        }

        return false;
      })
      .slice(0, parsedLimit);

    console.log("Posts found after visibility filter:", posts.length);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: posts.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get user posts with visibility filtering and sorting
// @route   GET /api/social/posts/user/:userId
// @access  Private
router.get("/posts/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "recent" } = req.query;
    const { userId } = req.params;
    const viewerId = req.user.id;

    console.log(
      "Backend: Getting posts for user:",
      userId,
      "by viewer:",
      viewerId
    );

    // Get target user data for privacy checks
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(viewerId).select(
      "following blockedUsers blockedBy"
    );
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (isBlockedBetweenUsers(currentUser, targetUser)) {
      return res.json({
        success: true,
        data: {
          posts: [],
          viewerPermissions: {
            isProfileOwner: false,
            isFollower: false,
            canViewProfile: false,
            canViewPosts: false,
            hasFollowRequest: false,
            canFollow: false,
          },
        },
      });
    }

    // Determine viewer relationship with profile owner
    const isProfileOwner = viewerId === userId;
    const isFollower =
      hasUserId(targetUser.followers, viewerId) ||
      hasUserId(currentUser.following, userId);
    const hasFollowRequest = hasUserId(targetUser.followRequests, viewerId);

    console.log("Viewer relationship:", {
      isProfileOwner,
      isFollower,
      hasFollowRequest,
    });

    // Determine viewer permissions based on privacy settings
    const privacy = targetUser.preferences?.privacy;
    const profileVisibility = privacy?.profileVisibility || "public";
    const isFriend =
      hasUserId(targetUser.followers, viewerId) &&
      hasUserId(targetUser.following, viewerId);

    let canViewProfile = false;
    let canViewPosts = false;

    if (isProfileOwner) {
      // Own profile - full access
      canViewProfile = true;
      canViewPosts = true;
    } else if (profileVisibility === "public") {
      // Public profile - check individual settings
      canViewProfile = true;
      canViewPosts = privacy?.showPosts === "public" || isFollower;
    } else if (profileVisibility === "private") {
      // Private profile - only followers can see
      canViewProfile = isFollower;
      canViewPosts = isFollower;
    } else if (profileVisibility === "friends") {
      // Friends-only profile
      canViewProfile = isFriend || isFollower;
      canViewPosts = isFriend || isFollower;
    }

    // If can't view posts, return empty array
    if (!canViewPosts) {
      return res.json({
        success: true,
        data: {
          posts: [],
          viewerPermissions: {
            isProfileOwner,
            isFollower,
            canViewProfile,
            canViewPosts,
            hasFollowRequest,
            canFollow: !isProfileOwner && !isFollower && !hasFollowRequest,
          },
        },
      });
    }

    // Build visibility filter based on viewer permissions
    let visibilityFilter = {};

    if (isProfileOwner) {
      // Profile owner sees all their posts
      visibilityFilter = {};
    } else if (isFollower || (profileVisibility === "friends" && isFriend)) {
      // Followers/friends see public and friends posts
      visibilityFilter = { visibility: { $in: ["public", "friends"] } };
    } else {
      // Non-followers see only public posts
      visibilityFilter = { visibility: "public" };
    }

    // Build query
    const query = {
      user: userId,
      status: "active",
      ...visibilityFilter,
    };

    console.log("Query:", JSON.stringify(query));
    console.log("Target user ID for posts:", userId);
    console.log("Viewer ID:", viewerId);

    // Determine sort order
    let sortOrder = {};
    if (sort === "popular") {
      sortOrder = { likeCount: -1, commentCount: -1, createdAt: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const posts = await Post.find(query)
      .populate("user", "name username profilePicture")
      .populate("comments.user", "name username profilePicture")
      .populate("comments.replies.user", "name username profilePicture")
      .populate("likes.user", "name username profilePicture")
      .populate("shares.user", "name username profilePicture")
      .populate("bookmarks.user", "name username profilePicture")
      .populate("mentions", "name username profilePicture")
      .sort(sortOrder)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    console.log("Backend: Found posts count:", posts.length);
    console.log(
      "Backend: Posts visibility breakdown:",
      posts.map((p) => ({
        id: p._id,
        visibility: p.visibility,
        type: p.type,
        userId: p.user?._id || p.user,
        userName: p.user?.name || "Unknown",
      }))
    );

    // Add interaction status for viewer
    const postsWithInteractions = posts.map((post) => {
      const postObj = post.toObject();
      postObj.isLiked = post.isLikedBy(viewerId);
      postObj.isBookmarked = post.isBookmarkedBy(viewerId);
      postObj.isViewed = post.isViewedBy(viewerId);
      return postObj;
    });

    res.json({
      success: true,
      data: {
        posts: postsWithInteractions,
        viewerPermissions: {
          isProfileOwner,
          isFollower,
          canViewProfile,
          canViewPosts,
          hasFollowRequest,
          canFollow: !isProfileOwner && !isFollower && !hasFollowRequest,
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(posts.length / limit),
          hasNext: posts.length === parseInt(limit),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Search posts
// @route   GET /api/social/posts/search
// @access  Public
router.get("/posts/search", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const posts = await Post.searchPosts(q, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(posts.length / limit),
          hasNext: posts.length === parseInt(limit),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Search posts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get single post
// @route   GET /api/social/posts/:postId
// @access  Public
router.get("/posts/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "name username profilePicture")
      .populate("comments.user", "name username profilePicture")
      .populate("comments.replies.user", "name username profilePicture")
      .populate("likes.user", "name username profilePicture")
      .populate("shares.user", "name username profilePicture")
      .populate("bookmarks.user", "name username profilePicture")
      .populate("mentions", "name username profilePicture");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Add view if user is authenticated
    if (req.user) {
      await post.addView(req.user.id);
    }

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Error fetching single post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Update post
// @route   PUT /api/social/posts/:postId
// @access  Private
router.put(
  "/posts/:postId",
  authenticateToken,
  [
    body("content")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Post content must be between 1 and 5000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const post = await Post.findById(req.params.postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check if user owns the post
      if (post.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this post",
        });
      }

      const { content, visibility, tags, hashtags } = req.body;

      // Store original content for edit history
      if (!post.isEdited) {
        post.originalContent = post.content;
        post.isEdited = true;
      }

      post.content = content;
      post.editedAt = new Date();
      if (visibility) post.visibility = visibility;
      if (tags) post.tags = tags.map((tag) => tag.toLowerCase().trim());
      if (hashtags)
        post.hashtags = hashtags.map((hashtag) => hashtag.toLowerCase().trim());

      await post.save();

      await post.populate("user", "name username profilePicture");

      res.json({
        success: true,
        message: "Post updated successfully",
        data: { post },
      });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Report a post for moderation
// @route   POST /api/social/posts/:postId/report
// @access  Private
router.post("/posts/:postId/report", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const reporterId = req.user.id;
    const reason = String(req.body.reason || "").trim();

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyPending = Array.isArray(post.reports)
      ? post.reports.some(
          (report) =>
            report.reporter?.toString() === reporterId && report.status === "pending"
        )
      : false;

    if (alreadyPending) {
      return res.status(400).json({
        success: false,
        message: "You already reported this post",
      });
    }

    post.reports.push({
      reporter: reporterId,
      reason,
      status: "pending",
      createdAt: new Date(),
    });

    await post.save();

    res.json({
      success: true,
      message: "Post reported successfully",
      data: {
        pendingReports: post.reports.filter((report) => report.status === "pending")
          .length,
      },
    });
  } catch (error) {
    console.error("Error reporting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Like/unlike a post
// @route   POST /api/social/posts/:postId/like
// @access  Private
router.post("/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isLiked = post.isLikedBy(userId);
    if (isLiked) {
      await post.removeLike(userId);
    } else {
      await post.addLike(userId);
    }

    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      data: {
        isLiked: !isLiked,
        likeCount: post.likes.length,
      },
    });
  } catch (error) {
    console.error("Error toggling post like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Bookmark/unbookmark a post
// @route   POST /api/social/posts/:postId/bookmark
// @access  Private
router.post("/posts/:postId/bookmark", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isBookmarked = post.isBookmarkedBy(userId);
    if (isBookmarked) {
      await post.removeBookmark(userId);
    } else {
      await post.addBookmark(userId);
    }

    res.json({
      success: true,
      message: isBookmarked ? "Bookmark removed" : "Post bookmarked",
      data: {
        isBookmarked: !isBookmarked,
        bookmarkCount: post.bookmarks.length,
      },
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Save/unsave alias for bookmark endpoint
// @route   POST /api/social/posts/:postId/save
// @access  Private
router.post("/posts/:postId/save", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isBookmarked = post.isBookmarkedBy(userId);
    if (isBookmarked) {
      await post.removeBookmark(userId);
    } else {
      await post.addBookmark(userId);
    }

    res.json({
      success: true,
      message: isBookmarked ? "Post unsaved" : "Post saved",
      data: {
        isSaved: !isBookmarked,
        bookmarkCount: post.bookmarks.length,
      },
    });
  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Share a post
// @route   POST /api/social/posts/:postId/share
// @access  Private
router.post("/posts/:postId/share", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await post.addShare(userId, postId);

    res.json({
      success: true,
      message: "Post shared successfully",
      data: {
        shareCount: post.shares.length,
      },
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get comments for a post
// @route   GET /api/social/posts/:postId/comments
// @access  Private
router.get("/posts/:postId/comments", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("comments.user", "name username profilePicture")
      .populate("comments.replies.user", "name username profilePicture");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comments = (post.comments || []).map((comment) => {
      const commentObj = comment.toObject();

      return {
        ...commentObj,
        likes: (comment.likes || []).length,
        isLiked: (comment.likes || []).some(
          (id) => id.toString() === req.user.id.toString()
        ),
        replies: (comment.replies || []).map((reply) => {
          const replyObj = reply.toObject ? reply.toObject() : reply;
          return {
            ...replyObj,
            likes: (reply.likes || []).length,
            isLiked: (reply.likes || []).some(
              (id) => id.toString() === req.user.id.toString()
            ),
          };
        }),
      };
    });

    res.json({
      success: true,
      comments,
      data: { comments },
    });
  } catch (error) {
    console.error("Error fetching post comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Reply to a post comment
// @route   POST /api/social/posts/:postId/comments/:commentId/replies
// @access  Private
router.post(
  "/posts/:postId/comments/:commentId/replies",
  authenticateToken,
  async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reply content is required",
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      comment.replies.push({
        user: req.user.id,
        content: content.trim(),
        likes: [],
      });

      await post.save();
      await post.populate("comments.replies.user", "name username profilePicture");

      const updatedComment = post.comments.id(commentId);
      const latestReply = updatedComment.replies[updatedComment.replies.length - 1];

      res.status(201).json({
        success: true,
        message: "Reply added successfully",
        data: {
          commentId,
          reply: {
            ...latestReply.toObject(),
            likes: 0,
            isLiked: false,
          },
        },
      });
    } catch (error) {
      console.error("Error adding reply to comment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Add comment to a post
// @route   POST /api/social/posts/:postId/comments
// @access  Private
router.post("/posts/:postId/comments", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.comments.unshift({
      user: req.user.id,
      content: content.trim(),
      likes: [],
      replies: [],
    });
    await post.save();
    await post.populate("comments.user", "name username profilePicture");
    await post.populate("comments.replies.user", "name username profilePicture");

    const comment = post.comments[0];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
      data: { comment },
    });
  } catch (error) {
    console.error("Error adding post comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Like/unlike a comment
// @route   POST /api/social/comments/:commentId/like
// @access  Private
router.post("/comments/:commentId/like", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const post = await Post.findOne({ "comments._id": commentId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const alreadyLiked = (comment.likes || []).some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: alreadyLiked ? "Comment unliked" : "Comment liked",
      data: {
        commentId,
        isLiked: !alreadyLiked,
        likes: comment.likes.length,
      },
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Delete a post
// @route   DELETE /api/social/posts/:postId
// @access  Private
router.delete("/posts/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Frontend compatibility alias for unfollow
// @route   POST /api/social/users/:userId/unfollow
// @access  Private
router.post("/users/:userId/unfollow", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    currentUser.following = (currentUser.following || []).filter(
      (id) => id.toString() !== userId
    );
    targetUser.followers = (targetUser.followers || []).filter(
      (id) => id.toString() !== currentUserId
    );
    targetUser.followRequests = (targetUser.followRequests || []).filter(
      (id) => id.toString() !== currentUserId
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error unfollow alias:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @desc    Frontend compatibility alias for removing follower
// @route   POST /api/social/users/:userId/remove-follower
// @access  Private
router.post(
  "/users/:userId/remove-follower",
  authenticateToken,
  async (req, res) => {
    try {
      const followerId = req.params.userId;
      const currentUserId = req.user.id;

      const [currentUser, followerUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(followerId),
      ]);

      if (!currentUser || !followerUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      currentUser.followers = (currentUser.followers || []).filter(
        (id) => id.toString() !== followerId
      );
      followerUser.following = (followerUser.following || []).filter(
        (id) => id.toString() !== currentUserId
      );

      await Promise.all([currentUser.save(), followerUser.save()]);

      res.json({
        success: true,
        message: "Follower removed successfully",
      });
    } catch (error) {
      console.error("Error removing follower:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Frontend compatibility alias for block user
// @route   POST /api/social/users/:userId/block
// @access  Private
router.post("/users/:userId/block", authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hadIncomingFollowRequest = hasUserId(
      currentUser.followRequests,
      targetUserId
    );

    if (
      !(currentUser.blockedUsers || []).some(
        (id) => id.toString() === targetUserId
      )
    ) {
      currentUser.blockedUsers.push(targetUserId);
    }

    if (
      !(targetUser.blockedBy || []).some(
        (id) => id.toString() === currentUserId
      )
    ) {
      targetUser.blockedBy = targetUser.blockedBy || [];
      targetUser.blockedBy.push(currentUserId);
    }

    currentUser.following = (currentUser.following || []).filter(
      (id) => id.toString() !== targetUserId
    );
    currentUser.followers = (currentUser.followers || []).filter(
      (id) => id.toString() !== targetUserId
    );
    currentUser.followRequests = (currentUser.followRequests || []).filter(
      (id) => id.toString() !== targetUserId
    );
    currentUser.pendingFollowRequests = (
      currentUser.pendingFollowRequests || []
    ).filter((id) => id.toString() !== targetUserId);

    targetUser.following = (targetUser.following || []).filter(
      (id) => id.toString() !== currentUserId
    );
    targetUser.followers = (targetUser.followers || []).filter(
      (id) => id.toString() !== currentUserId
    );
    targetUser.followRequests = (targetUser.followRequests || []).filter(
      (id) => id.toString() !== currentUserId
    );
    targetUser.pendingFollowRequests = (
      targetUser.pendingFollowRequests || []
    ).filter((id) => id.toString() !== currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    if (hadIncomingFollowRequest) {
      await appendFollowRequestAction({
        ownerId: currentUserId,
        requesterId: targetUserId,
        actionBy: currentUserId,
        action: "blocked",
        source: "single",
      });
    }

    res.json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Accept follow request (social path alias)
// @route   POST /api/social/users/:userId/accept-follow-request
// @access  Private
router.post(
  "/users/:userId/accept-follow-request",
  authenticateToken,
  async (req, res) => {
    try {
      const requesterId = req.params.userId;
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

      if (isBlockedBetweenUsers(currentUser, requester)) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot accept this request while either user is blocked. Unblock first.",
        });
      }

      const hasRequest = (currentUser.followRequests || []).some(
        (id) => id.toString() === requesterId
      );
      if (!hasRequest) {
        return res.status(400).json({
          success: false,
          message: "No follow request from this user",
        });
      }

      currentUser.followRequests = (currentUser.followRequests || []).filter(
        (id) => id.toString() !== requesterId
      );
      if (!(currentUser.followers || []).some((id) => id.toString() === requesterId)) {
        currentUser.followers.push(requesterId);
      }

      requester.pendingFollowRequests = (requester.pendingFollowRequests || []).filter(
        (id) => id.toString() !== currentUserId
      );
      if (!(requester.following || []).some((id) => id.toString() === currentUserId)) {
        requester.following.push(currentUserId);
      }

      await Promise.all([currentUser.save(), requester.save()]);

      await appendFollowRequestAction({
        ownerId: currentUserId,
        requesterId,
        actionBy: currentUserId,
        action: "accepted",
        source: "single",
      });

      const Notification = require("../models/Notification");
      await Notification.create({
        type: "follow_accepted",
        message: `${currentUser.name} accepted your follow request`,
        userId: requesterId,
        user: currentUserId,
      });

      res.json({
        success: true,
        message: "Follow request accepted",
      });
    } catch (error) {
      console.error("Error accepting follow request:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Reject follow request (social path alias)
// @route   POST /api/social/users/:userId/reject-follow-request
// @access  Private
router.post(
  "/users/:userId/reject-follow-request",
  authenticateToken,
  async (req, res) => {
    try {
      const requesterId = req.params.userId;
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

      const hasRequest = (currentUser.followRequests || []).some(
        (id) => id.toString() === requesterId
      );
      if (!hasRequest) {
        return res.status(400).json({
          success: false,
          message: "No follow request from this user",
        });
      }

      currentUser.followRequests = (currentUser.followRequests || []).filter(
        (id) => id.toString() !== requesterId
      );
      requester.pendingFollowRequests = (requester.pendingFollowRequests || []).filter(
        (id) => id.toString() !== currentUserId
      );

      await Promise.all([currentUser.save(), requester.save()]);

      await appendFollowRequestAction({
        ownerId: currentUserId,
        requesterId,
        actionBy: currentUserId,
        action: "rejected",
        source: "single",
      });

      res.json({
        success: true,
        message: "Follow request rejected",
      });
    } catch (error) {
      console.error("Error rejecting follow request:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

module.exports = router;
