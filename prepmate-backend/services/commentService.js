const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureObjectId = (value, message) => {
  if (!isValidObjectId(value)) {
    throw createError(400, message);
  }
};

const ensureNonEmptyContent = (content, message) => {
  if (!content || !String(content).trim()) {
    throw createError(400, message);
  }
};

const getPostOrThrow = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw createError(404, "Post not found");
  }
  return post;
};

const getCommentOrThrow = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw createError(404, "Comment not found");
  }
  return comment;
};

const getCommentsForPost = async ({ postId, page = 1, limit = 20, sort = "newest", currentUserId }) => {
  ensureObjectId(postId, "Invalid post ID");
  await getPostOrThrow(postId);

  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.max(1, Number(limit) || 20);
  const skip = (normalizedPage - 1) * normalizedLimit;
  const sortOptions = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const [comments, totalComments] = await Promise.all([
    Comment.find({ post: postId })
      .populate("user", "name username profilePicture")
      .sort(sortOptions)
      .skip(skip)
      .limit(normalizedLimit),
    Comment.countDocuments({ post: postId }),
  ]);

  if (currentUserId) {
    comments.forEach((comment) => {
      comment.isLiked = comment.likes.some((like) => like._id.toString() === currentUserId);
    });
  }

  return {
    comments,
    pagination: {
      currentPage: normalizedPage,
      totalPages: Math.ceil(totalComments / normalizedLimit),
      totalComments,
      hasNextPage: skip + comments.length < totalComments,
      hasPrevPage: normalizedPage > 1,
    },
  };
};

const addComment = async ({ postId, content, userId }) => {
  ensureObjectId(postId, "Invalid post ID");
  ensureNonEmptyContent(content, "Comment content is required");

  await getPostOrThrow(postId);

  const comment = new Comment({
    post: postId,
    user: userId,
    content: String(content).trim(),
  });

  await comment.save();
  await comment.populate("user", "name username profilePicture");

  return comment;
};

const toggleLike = async ({ commentId, userId }) => {
  ensureObjectId(commentId, "Invalid comment ID");

  const comment = await getCommentOrThrow(commentId);
  const isLiked = comment.toggleLike(userId);
  await comment.save();
  await comment.populate("user", "name username profilePicture");

  return { comment, isLiked };
};

const addReply = async ({ commentId, content, userId }) => {
  ensureObjectId(commentId, "Invalid comment ID");
  ensureNonEmptyContent(content, "Reply content is required");

  const comment = await getCommentOrThrow(commentId);
  const reply = comment.addReply(userId, String(content).trim());

  await comment.save();
  await comment.populate("replies.user", "name username profilePicture");

  return { comment, reply };
};

const editComment = async ({ commentId, content, userId }) => {
  ensureObjectId(commentId, "Invalid comment ID");
  ensureNonEmptyContent(content, "Comment content is required");

  const comment = await getCommentOrThrow(commentId);
  if (comment.user.toString() !== userId) {
    throw createError(403, "Not authorized to edit this comment");
  }

  comment.content = String(content).trim();
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  return comment;
};

const deleteComment = async ({ commentId, userId, userRole }) => {
  ensureObjectId(commentId, "Invalid comment ID");

  const comment = await getCommentOrThrow(commentId);

  if (comment.user.toString() !== userId && userRole !== "admin") {
    throw createError(403, "Not authorized to delete this comment");
  }

  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
  await Comment.findByIdAndDelete(commentId);
};

const getUserComments = async ({ userId, page = 1, limit = 20 }) => {
  ensureObjectId(userId, "Invalid user ID");

  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.max(1, Number(limit) || 20);
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [comments, totalComments] = await Promise.all([
    Comment.find({ user: userId })
      .populate("post", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    Comment.countDocuments({ user: userId }),
  ]);

  return {
    comments,
    pagination: {
      currentPage: normalizedPage,
      totalPages: Math.ceil(totalComments / normalizedLimit),
      totalComments,
      hasNextPage: skip + comments.length < totalComments,
      hasPrevPage: normalizedPage > 1,
    },
  };
};

const getTrendingComments = async ({ limit = 10 }) => {
  const normalizedLimit = Math.max(1, Number(limit) || 10);

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
      $limit: normalizedLimit,
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

  return trendingComments;
};

module.exports = {
  getCommentsForPost,
  addComment,
  toggleLike,
  addReply,
  editComment,
  deleteComment,
  getUserComments,
  getTrendingComments,
};
