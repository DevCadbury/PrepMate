const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true, // Optimize queries
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimize queries
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashtags: [String],
    // For real-time features
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true, // Optimize for activity queries
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
commentSchema.index({ post: 1, createdAt: -1 }); // For fetching comments by post
commentSchema.index({ user: 1, createdAt: -1 }); // For user's comment history
commentSchema.index({ likes: 1 }); // For like queries
commentSchema.index({ mentions: 1 }); // For mention notifications

// Virtual for like count
commentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual("replyCount").get(function () {
  return this.replies.length;
});

// Method to check if user liked the comment
commentSchema.methods.isLikedBy = function (userId) {
  return this.likes.includes(userId);
};

// Method to toggle like
commentSchema.methods.toggleLike = function (userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
    return false; // Unlike
  } else {
    this.likes.push(userId);
    return true; // Like
  }
};

// Method to add reply
commentSchema.methods.addReply = function (userId, content) {
  this.replies.push({
    user: userId,
    content,
    createdAt: new Date(),
  });
  this.lastActivity = new Date();
  return this.replies[this.replies.length - 1];
};

// Method to remove reply
commentSchema.methods.removeReply = function (replyId) {
  this.replies = this.replies.filter(
    (reply) => reply._id.toString() !== replyId
  );
  this.lastActivity = new Date();
};

// Pre-save middleware to update lastActivity
commentSchema.pre("save", function (next) {
  this.lastActivity = new Date();
  next();
});

// Static method to get comments with user data
commentSchema.statics.getCommentsWithUsers = function (postId, options = {}) {
  const { limit = 20, skip = 0, sort = { createdAt: -1 } } = options;

  return this.find({ post: postId })
    .populate("user", "name username profilePicture")
    .populate("likes", "name username profilePicture")
    .populate("mentions", "name username profilePicture")
    .populate("replies.user", "name username profilePicture")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get comment count for a post
commentSchema.statics.getCommentCount = function (postId) {
  return this.countDocuments({ post: postId });
};

// Static method to get user's comment activity
commentSchema.statics.getUserComments = function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({ user: userId })
    .populate("post", "content type")
    .populate("user", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

module.exports = mongoose.model("Comment", commentSchema);
