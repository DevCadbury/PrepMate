const express = require("express");
const { body, validationResult } = require("express-validator");
// Removed asyncHandler dependency
const { authenticateToken } = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
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
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
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

      // Upload media files to Cloudinary if any
      const media = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
              {
                folder: "prepmate/posts",
                resource_type: file.mimetype.startsWith("video/")
                  ? "video"
                  : "image",
                transformation: [
                  { width: 1200, height: 1200, crop: "limit" },
                  { quality: "auto" },
                ],
              }
            );

            media.push({
              url: result.secure_url,
              type: file.mimetype.startsWith("video/") ? "video" : "image",
              thumbnail: result.secure_url,
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
      if (mentions && mentions.length > 0) {
        for (const mention of mentions) {
          const user = await User.findOne({
            $or: [{ username: mention }, { name: mention }],
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

      // Create the post
      const post = new Post({
        user: req.user.id,
        content: type === "code" ? "" : content, // Don't store code in content field
        type,
        media,
        codeSnippets: codeSnippets.length > 0 ? codeSnippets : undefined,
        visibility,
        tags: parsedTags.map((tag) => tag.toLowerCase().trim()),
        hashtags: hashtags.map((hashtag) => hashtag.toLowerCase().trim()),
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

      const isFollowing = currentUser.following.includes(userId);
      const isFollower = targetUser.followers.includes(currentUserId);
      const hasRequestSent =
        targetUser.followRequests?.includes(currentUserId) || false;
      const isPrivateAccount =
        targetUser.privacy?.profileVisibility === "private";

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
          privacy: targetUser.privacy,
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

    // Check if already following
    if (currentUser.following.includes(userId)) {
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
    if (userToFollow.followRequests?.includes(followerId)) {
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
      userToFollow.privacy?.profileVisibility === "private";

    if (isPrivateAccount) {
      // For private accounts, add to follow requests instead of following directly
      if (!userToFollow.followRequests) {
        userToFollow.followRequests = [];
      }
      userToFollow.followRequests.push(followerId);
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
      currentUser.following.push(userId);
      await currentUser.save();

      userToFollow.followers.push(followerId);
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

    // Check if following
    const isFollowing = currentUser.following.includes(userId);
    // Check if follow request sent
    const hasRequestSent = userToUnfollow.followRequests?.includes(followerId);

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

    console.log("=== GETTING FEED POSTS ===");
    console.log("User ID:", userId);
    console.log("Page:", page);
    console.log("Limit:", limit);

    // Get current user to find followed users
    const currentUser = await User.findById(userId);
    const followedUsers = currentUser.following;

    // Add current user to the list to include their own posts
    const usersToShow = [...followedUsers, userId];

    console.log("Users to show posts from:", usersToShow);

    const posts = await Post.find({
      user: { $in: usersToShow },
      visibility: { $in: ["public", "friends"] },
      status: "active",
    })
      .populate("user", "name username profilePicture")
      .populate("comments.user", "name username profilePicture")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    console.log("Posts found:", posts.length);
    console.log("Posts:", posts);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
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

    // Determine viewer relationship with profile owner
    const isProfileOwner = viewerId === userId;
    const isFollower = targetUser.followers.includes(viewerId);
    const hasFollowRequest = targetUser.followRequests.includes(viewerId);

    console.log("Viewer relationship:", {
      isProfileOwner,
      isFollower,
      hasFollowRequest,
    });

    // Determine viewer permissions based on privacy settings
    const privacy = targetUser.preferences?.privacy;
    const profileVisibility = privacy?.profileVisibility || "public";

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
      const isFriend =
        targetUser.followers.includes(viewerId) &&
        targetUser.following.includes(viewerId);
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

module.exports = router;
