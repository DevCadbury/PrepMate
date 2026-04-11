const commentService = require("../services/commentService");

const handleServiceError = (res, error) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return null;
};

const getCommentsByPost = async (req, res) => {
  try {
    const result = await commentService.getCommentsForPost({
      postId: req.params.postId,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      currentUserId: req.user?.id,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error fetching comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createComment = async (req, res) => {
  try {
    const comment = await commentService.addComment({
      postId: req.params.postId,
      content: req.body.content,
      userId: req.user.id,
    });

    return res.status(201).json({
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
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error adding comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const toggleCommentLike = async (req, res) => {
  try {
    const { comment, isLiked } = await commentService.toggleLike({
      commentId: req.params.commentId,
      userId: req.user.id,
    });

    return res.json({
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
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error liking comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const replyToComment = async (req, res) => {
  try {
    const { reply } = await commentService.addReply({
      commentId: req.params.commentId,
      content: req.body.content,
      userId: req.user.id,
    });

    return res.status(201).json({
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
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error replying to comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateComment = async (req, res) => {
  try {
    const comment = await commentService.editComment({
      commentId: req.params.commentId,
      content: req.body.content,
      userId: req.user.id,
    });

    return res.json({
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
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error editing comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const removeComment = async (req, res) => {
  try {
    await commentService.deleteComment({
      commentId: req.params.commentId,
      userId: req.user.id,
      userRole: req.user.role,
    });

    return res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error deleting comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getCommentsByUser = async (req, res) => {
  try {
    const result = await commentService.getUserComments({
      userId: req.params.userId,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error fetching user comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTrendingComments = async (req, res) => {
  try {
    const trendingComments = await commentService.getTrendingComments({
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data: {
        trendingComments,
      },
    });
  } catch (error) {
    const handled = handleServiceError(res, error);
    if (handled) return handled;

    console.error("Error fetching trending comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  toggleCommentLike,
  replyToComment,
  updateComment,
  removeComment,
  getCommentsByUser,
  getTrendingComments,
};
