const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
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
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: [
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
      ],
      default: "text",
    },
    media: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video", "audio", "document"],
          required: true,
        },
        thumbnail: String,
        duration: Number, // for videos/audio
        size: Number,
        filename: String,
        cloudinaryId: String,
      },
    ],
    codeSnippets: [
      {
        language: {
          type: String,
          required: true,
          default: "javascript",
        },
        code: {
          type: String,
          required: true,
        },
        filename: String,
        description: String,
      },
    ],
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [
            {
              user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
              },
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
        },
      ],
      endDate: Date,
      allowMultiple: {
        type: Boolean,
        default: false,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [commentSchema],
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        originalPost: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      },
    ],
    bookmarks: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        bookmarkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    originalContent: String,
    isRepost: {
      type: Boolean,
      default: false,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    category: {
      type: String,
      enum: [
        "general",
        "tech",
        "education",
        "career",
        "interview",
        "coding",
        "roadmap",
        "achievement",
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted", "hidden"],
      default: "active",
    },
    metadata: {
      linkPreview: {
        title: String,
        description: String,
        image: String,
        url: String,
      },
      achievement: {
        type: String,
        title: String,
        description: String,
        icon: String,
      },
      interview: {
        company: String,
        position: String,
        difficulty: String,
        status: String,
      },
      roadmap: {
        title: String,
        description: String,
        progress: Number,
        steps: [
          {
            title: String,
            description: String,
            completed: Boolean,
            order: Number,
          },
        ],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ category: 1 });
postSchema.index({ "likes.user": 1 });
postSchema.index({ "comments.user": 1 });
postSchema.index({ "shares.user": 1 });
postSchema.index({ "bookmarks.user": 1 });

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual("shareCount").get(function () {
  return this.shares.length;
});

// Virtual for view count
postSchema.virtual("viewCount").get(function () {
  return this.views.length;
});

// Virtual for bookmark count
postSchema.virtual("bookmarkCount").get(function () {
  return this.bookmarks.length;
});

// Ensure virtual fields are serialized
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// Methods
postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((like) => like.user.toString() === userId.toString());
};

postSchema.methods.isBookmarkedBy = function (userId) {
  return this.bookmarks.some(
    (bookmark) => bookmark.user.toString() === userId.toString()
  );
};

postSchema.methods.isViewedBy = function (userId) {
  return this.views.some((view) => view.user.toString() === userId.toString());
};

postSchema.methods.addLike = function (userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

postSchema.methods.removeLike = function (userId) {
  this.likes = this.likes.filter(
    (like) => like.user.toString() !== userId.toString()
  );
  return this.save();
};

postSchema.methods.addBookmark = function (userId) {
  if (!this.isBookmarkedBy(userId)) {
    this.bookmarks.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

postSchema.methods.removeBookmark = function (userId) {
  this.bookmarks = this.bookmarks.filter(
    (bookmark) => bookmark.user.toString() !== userId.toString()
  );
  return this.save();
};

postSchema.methods.addView = function (userId) {
  if (!this.isViewedBy(userId)) {
    this.views.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

postSchema.methods.addComment = function (userId, content) {
  this.comments.push({
    user: userId,
    content,
  });
  return this.save();
};

postSchema.methods.addShare = function (userId, originalPostId = null) {
  this.shares.push({
    user: userId,
    originalPost: originalPostId || this._id,
  });
  return this.save();
};

// Static methods
postSchema.statics.getFeedPosts = function (userId, page = 1, limit = 10) {
  return this.find({
    $or: [
      { visibility: "public" },
      { user: userId },
      { "user.followers": userId },
    ],
    status: "active",
  })
    .populate("user", "name username profilePicture")
    .populate("comments.user", "name username profilePicture")
    .populate("likes.user", "name username profilePicture")
    .populate("shares.user", "name username profilePicture")
    .populate("bookmarks.user", "name username profilePicture")
    .populate("mentions", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

postSchema.statics.getUserPosts = function (userId, page = 1, limit = 10) {
  console.log("Post Model: getUserPosts called for userId:", userId);

  const query = {
    user: userId,
    status: "active",
  };

  console.log("Post Model: Query:", JSON.stringify(query));

  return this.find(query)
    .populate("user", "name username profilePicture")
    .populate("comments.user", "name username profilePicture")
    .populate("likes.user", "name username profilePicture")
    .populate("shares.user", "name username profilePicture")
    .populate("bookmarks.user", "name username profilePicture")
    .populate("mentions", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

postSchema.statics.searchPosts = function (query, page = 1, limit = 10) {
  return this.find({
    $or: [
      { content: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } },
      { hashtags: { $in: [new RegExp(query, "i")] } },
    ],
    status: "active",
    visibility: "public",
  })
    .populate("user", "name username profilePicture")
    .populate("comments.user", "name username profilePicture")
    .populate("likes.user", "name username profilePicture")
    .populate("shares.user", "name username profilePicture")
    .populate("bookmarks.user", "name username profilePicture")
    .populate("mentions", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model("Post", postSchema);
