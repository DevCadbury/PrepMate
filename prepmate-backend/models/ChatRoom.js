const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    name: {
      type: String,
      required: function () {
        return this.type === "group";
      },
    },
    description: String,
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ type: 1, createdAt: -1 });
chatRoomSchema.index({ lastMessage: 1 });

// Virtual for participant count
chatRoomSchema.virtual("participantCount").get(function () {
  return this.participants?.length || 0;
});

// Method to add a participant
chatRoomSchema.methods.addParticipant = async function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    await this.save();
  }
  return this;
};

// Method to remove a participant
chatRoomSchema.methods.removeParticipant = async function (userId) {
  this.participants = this.participants.filter(
    (participant) => !participant.equals(userId)
  );

  // Remove from admins if they were an admin
  this.admins = this.admins.filter((admin) => !admin.equals(userId));

  await this.save();
  return this;
};

// Method to add an admin
chatRoomSchema.methods.addAdmin = async function (userId) {
  if (!this.admins.includes(userId)) {
    this.admins.push(userId);
    await this.save();
  }
  return this;
};

// Method to remove an admin
chatRoomSchema.methods.removeAdmin = async function (userId) {
  this.admins = this.admins.filter((admin) => !admin.equals(userId));
  await this.save();
  return this;
};

// Static method to find or create direct chat
chatRoomSchema.statics.findOrCreateDirectChat = async function (
  user1Id,
  user2Id
) {
  // Check if direct chat already exists
  let chatRoom = await this.findOne({
    type: "direct",
    participants: { $all: [user1Id, user2Id] },
  });

  if (!chatRoom) {
    // Create new direct chat
    chatRoom = new this({
      type: "direct",
      participants: [user1Id, user2Id],
      createdBy: user1Id,
    });

    await chatRoom.save();
  }

  return chatRoom;
};

// Static method to get user's chat rooms
chatRoomSchema.statics.getUserChatRooms = async function (
  userId,
  options = {}
) {
  const { limit = 20, skip = 0, type } = options;

  let query = {
    participants: userId,
    isActive: true,
  };

  if (type) query.type = type;

  return await this.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("participants", "name username profilePicture isOnline lastSeen")
    .populate("admins", "name profilePicture")
    .populate("lastMessage")
    .populate("createdBy", "name profilePicture");
};

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
