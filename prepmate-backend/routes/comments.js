const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const commentController = require("../controllers/commentController");

const router = express.Router();

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get("/post/:postId", commentController.getCommentsByPost);

// @desc    Add comment to a post
// @route   POST /api/comments/post/:postId
// @access  Private
router.post("/post/:postId", authenticateToken, commentController.createComment);

// @desc    Like/unlike a comment
// @route   POST /api/comments/:commentId/like
// @access  Private
router.post("/:commentId/like", authenticateToken, commentController.toggleCommentLike);

// @desc    Reply to a comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
router.post("/:commentId/reply", authenticateToken, commentController.replyToComment);

// @desc    Edit a comment
// @route   PUT /api/comments/:commentId
// @access  Private
router.put("/:commentId", authenticateToken, commentController.updateComment);

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
router.delete("/:commentId", authenticateToken, commentController.removeComment);

// @desc    Get user's comment history
// @route   GET /api/comments/user/:userId
// @access  Public
router.get("/user/:userId", commentController.getCommentsByUser);

// @desc    Get trending comments (most liked)
// @route   GET /api/comments/trending
// @access  Public
router.get("/trending", commentController.getTrendingComments);

module.exports = router;
