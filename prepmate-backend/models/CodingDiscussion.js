const mongoose = require("mongoose");

const codingDiscussionReplySchema = new mongoose.Schema(
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
      maxlength: [2000, "Reply cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const codingDiscussionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingProblem",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [4000, "Discussion content cannot exceed 4000 characters"],
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    replies: {
      type: [codingDiscussionReplySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

codingDiscussionSchema.index({ problem: 1, createdAt: -1 });

module.exports = mongoose.model("CodingDiscussion", codingDiscussionSchema);
