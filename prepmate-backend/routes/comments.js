const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const logger = require("../utils/logger");

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, sort = "newest" } = req.query;

    const skip = (page - 1) * limit;
    const sortOptions =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Get comments with user data
    const comments = await Comment.find({ post: postId })
      .populate("user", "name username profilePicture")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Add like status for current user if authenticated
    if (req.user) {
      comments.forEach((comment) => {
        comment.isLiked = comment.likes.some(
          (like) => like._id.toString() === req.user.id
        );
      });
    }

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ post: postId });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNextPage: skip + comments.length < totalComments,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Add comment to a post
// @route   POST /api/comments/post/:postId
// @access  Private
router.post("/post/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create comment
    const comment = new Comment({
      post: postId,
      user: userId,
      content: content.trim(),
    });

    await comment.save();

    // Populate user data for response
    await comment.populate("user", "name username profilePicture");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment: {
          _id: comment._id,
          content: comment.content,
          user: comment.user,
          likes: [],
          replies: [],
          createdAt: comment.createdAt,
          isLiked: false,
        },
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Like/unlike a comment
// @route   POST /api/comments/:commentId/like
// @access  Private
router.post("/:commentId/like", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const wasLiked = comment.isLikedBy(userId);
    const isLiked = comment.toggleLike(userId);
    await comment.save();

    // Populate user data
    await comment.populate("user", "name username profilePicture");

    res.json({
      success: true,
      message: isLiked ? "Comment liked" : "Comment unliked",
      data: {
        comment: {
          _id: comment._id,
          likes: comment.likes,
          likeCount: comment.likeCount,
          isLiked,
        },
      },
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Reply to a comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
router.post("/:commentId/reply", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = comment.addReply(userId, content.trim());
    await comment.save();

    // Populate reply user data
    await comment.populate("replies.user", "name username profilePicture");

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: {
        reply: {
          _id: reply._id,
          content: reply.content,
          user: reply.user,
          createdAt: reply.createdAt,
          likes: reply.likes || [],
        },
      },
    });
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Edit a comment
// @route   PUT /api/comments/:commentId
// @access  Private
router.put("/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment: {
          _id: comment._id,
          content: comment.content,
          isEdited: comment.isEdited,
          editedAt: comment.editedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
router.delete("/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user owns the comment or is admin
    if (comment.user.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Update post comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -1 },
    });

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get user's comment history
// @route   GET /api/comments/user/:userId
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ user: userId })
      .populate("post", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNextPage: skip + comments.length < totalComments,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get trending comments (most liked)
// @route   GET /api/comments/trending
// @access  Public
router.get("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trendingComments = await Comment.aggregate([
      {
        $addFields: {
          likeCount: { $size: "$likes" },
        },
      },
      {
        $match: {
          likeCount: { $gt: 0 },
        },
      },
      {
        $sort: { likeCount: -1, createdAt: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          content: 1,
          likeCount: 1,
          createdAt: 1,
          "user.name": 1,
          "user.username": 1,
          "user.profilePicture": 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        trendingComments,
      },
    });
  } catch (error) {
    console.error("Error fetching trending comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
