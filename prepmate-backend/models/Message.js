const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50000, // Increased for code messages
    },
    type: {
      type: String,
      enum: ["text", "image", "audio", "video", "file", "location"],
      default: "text",
    },
    media: {
      url: String,
      thumbnail: String,
      duration: Number, // for audio/video
      size: Number,
      filename: String,
      cloudinaryId: String,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: [String], // Array of user IDs for whom message is deleted
      default: [],
    },
    editedAt: {
      type: Date,
    },
    seenAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    // For admin logs
    adminLogs: [
      {
        action: {
          type: String,
          enum: ["created", "edited", "deleted", "reported", "blocked"],
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        reason: String,
        details: String,
      },
    ],
    // For message reactions
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // For message forwarding
    forwardedFrom: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      originalSender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    // For message threading
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    threadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ chatRoomId: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ "reactions.userId": 1 });

// Virtual for reaction count
messageSchema.virtual("reactionCount").get(function () {
  return this.reactions.length;
});

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function () {
  this.status = "delivered";
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark message as seen
messageSchema.methods.markAsSeen = function () {
  this.status = "seen";
  this.seenAt = new Date();
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function (newContent) {
  this.message = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to delete message for specific user
messageSchema.methods.deleteForUser = function (userId) {
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
  }
  return this.save();
};

// Method to delete message for everyone
messageSchema.methods.deleteForEveryone = function () {
  this.isDeleted = true;
  this.message = "This message was deleted";
  this.media = null;
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  const existingReaction = this.reactions.find(
    (reaction) => reaction.userId.toString() === userId
  );

  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.timestamp = new Date();
  } else {
    this.reactions.push({ userId, emoji });
  }

  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => reaction.userId.toString() !== userId
  );
  return this.save();
};

// Static method to get messages for a chat room
messageSchema.statics.getChatMessages = function (chatRoomId, options = {}) {
  const { limit = 50, skip = 0, beforeId = null } = options;

  let query = { chatRoomId };

  if (beforeId) {
    query._id = { $lt: beforeId };
  }

  return this.find(query)
    .populate("senderId", "name username profilePicture")
    .populate("receiverId", "name username profilePicture")
    .populate("replyTo", "message senderId")
    .populate("reactions.userId", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function (userId, chatRoomId) {
  return this.countDocuments({
    receiverId: userId,
    chatRoomId,
    status: { $in: ["sent", "delivered"] },
    deletedFor: { $ne: userId },
  });
};

// Static method to mark messages as seen
messageSchema.statics.markMessagesAsSeen = function (userId, chatRoomId) {
  return this.updateMany(
    {
      receiverId: userId,
      chatRoomId,
      status: { $in: ["sent", "delivered"] },
    },
    {
      status: "seen",
      seenAt: new Date(),
    }
  );
};

// Static method to get message statistics for admin
messageSchema.statics.getMessageStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        textMessages: {
          $sum: { $cond: [{ $eq: ["$type", "text"] }, 1, 0] },
        },
        mediaMessages: {
          $sum: { $cond: [{ $ne: ["$type", "text"] }, 1, 0] },
        },
        editedMessages: {
          $sum: { $cond: ["$isEdited", 1, 0] },
        },
        deletedMessages: {
          $sum: { $cond: ["$isDeleted", 1, 0] },
        },
      },
    },
  ]);
};

// Pre-save middleware to add admin log
messageSchema.pre("save", function (next) {
  if (this.isNew) {
    this.adminLogs.push({
      action: "created",
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
