const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
// Removed asyncHandler dependency
const logger = require("../utils/logger");

const hasUserId = (list, userId) => {
  if (!Array.isArray(list) || !userId) return false;
  const target = userId.toString();
  return list.some((id) => id.toString() === target);
};

const isBlockedBetweenUsers = async (userAId, userBId) => {
  const [userA, userB] = await Promise.all([
    User.findById(userAId).select("blockedUsers blockedBy"),
    User.findById(userBId).select("blockedUsers blockedBy"),
  ]);

  if (!userA || !userB) {
    return false;
  }

  return (
    hasUserId(userA.blockedUsers, userBId) ||
    hasUserId(userA.blockedBy, userBId) ||
    hasUserId(userB.blockedUsers, userAId) ||
    hasUserId(userB.blockedBy, userAId)
  );
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// @desc    Get chat rooms for user
// @route   GET /api/chat/rooms
// @access  Private
router.get("/rooms", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate(
        "participants",
        "name username profilePicture isOnline lastSeen"
      )
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get unread counts for each room
    const roomsWithUnreadCounts = await Promise.all(
      chatRooms.map(async (room) => {
        // Temporarily disable unread count to isolate the issue
        const unreadCount = 0; // await Message.getUnreadCount(userId, room._id);
        return {
          ...room.toObject(),
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        chatRooms: roomsWithUnreadCounts,
        pagination: {
          currentPage: parseInt(page),
          hasNextPage: chatRooms.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get or create chat room between two users
// @route   POST /api/chat/room
// @access  Private
router.post("/room", authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (userId === participantId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create chat room with yourself",
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (await isBlockedBetweenUsers(userId, participantId)) {
      return res.status(403).json({
        success: false,
        message: "Cannot create chat because one of you has blocked the other",
      });
    }

    // Find existing chat room or create new one
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, participantId] },
      type: "direct",
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        participants: [userId, participantId],
        type: "direct",
        createdBy: userId,
      });
      await chatRoom.save();
    }

    await chatRoom.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    res.json({
      success: true,
      data: {
        chatRoom,
      },
    });
  } catch (error) {
    console.error("Error creating chat room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Frontend compatibility alias for direct chat creation
// @route   POST /api/chat/direct
// @access  Private
router.post("/direct", authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "participantId is required",
      });
    }

    if (userId === participantId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create chat room with yourself",
      });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (await isBlockedBetweenUsers(userId, participantId)) {
      return res.status(403).json({
        success: false,
        message: "Cannot create chat because one of you has blocked the other",
      });
    }

    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, participantId] },
      type: "direct",
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        participants: [userId, participantId],
        type: "direct",
        createdBy: userId,
      });
      await chatRoom.save();
    }

    await chatRoom.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    res.json({
      success: true,
      data: {
        chatRoom,
      },
    });
  } catch (error) {
    console.error("Error creating direct chat:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Create a group chat
// @route   POST /api/chat/group
// @access  Private
router.post("/group", authenticateToken, async (req, res) => {
  try {
    const { name, participants } = req.body;
    const userId = req.user.id;

    if (!name || !participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Group name and participants are required",
      });
    }

    // Add current user to participants
    const allParticipants = [...new Set([userId, ...participants])];

    // Verify all participants exist
    const existingUsers = await User.find({
      _id: { $in: allParticipants },
    });

    if (existingUsers.length !== allParticipants.length) {
      return res.status(400).json({
        success: false,
        message: "Some participants do not exist",
      });
    }

    // Create group chat room
    const chatRoom = new ChatRoom({
      name,
      participants: allParticipants,
      type: "group",
      createdBy: userId,
    });

    await chatRoom.save();
    await chatRoom.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        chatRoom,
      },
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get messages for a chat room
// @route   GET /api/chat/room/:roomId/messages
// @access  Private
router.get("/room/:roomId/messages", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, beforeId = null } = req.query;
    const skip = (page - 1) * limit;

    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom || !hasUserId(chatRoom.participants, userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat room",
      });
    }

    // Get messages
    const messages = await Message.getChatMessages(roomId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      beforeId,
    });

    // Mark messages as seen
    await Message.markMessagesAsSeen(userId, roomId);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Show oldest first
        pagination: {
          currentPage: parseInt(page),
          hasNextPage: messages.length === parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Send a message
// @route   POST /api/chat/room/:roomId/messages
// @access  Private
router.post("/room/:roomId/messages", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, type = "text", replyTo, media } = req.body;
    const userId = req.user.id;

    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom || !hasUserId(chatRoom.participants, userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat room",
      });
    }

    // Get receiver ID (the other participant)
    const receiverId = chatRoom.participants.find(
      (participant) => participant.toString() !== userId
    );

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat room",
      });
    }

    if (await isBlockedBetweenUsers(userId, receiverId)) {
      return res.status(403).json({
        success: false,
        message: "Cannot send message because one of you has blocked the other",
      });
    }

    // Create message
    const newMessage = new Message({
      senderId: userId,
      receiverId,
      chatRoomId: roomId,
      message,
      type,
      replyTo,
      media,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name username profilePicture");
    await newMessage.populate("receiverId", "name username profilePicture");
    await newMessage.populate("replyTo", "message senderId");

    // Update chat room's last message
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: newMessage._id,
      updatedAt: new Date(),
    });

    // Add admin log
    newMessage.adminLogs.push({
      action: "created",
      timestamp: new Date(),
    });
    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Edit a message
// @route   PUT /api/chat/messages/:messageId
// @access  Private
router.put("/messages/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const messageDoc = await Message.findById(messageId);
    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (messageDoc.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this message",
      });
    }

    // Check if message is within edit window (15 minutes)
    const messageAge = Date.now() - messageDoc.createdAt.getTime();
    if (messageAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: "Message can only be edited within 15 minutes",
      });
    }

    await messageDoc.editMessage(message);

    res.json({
      success: true,
      message: "Message edited successfully",
      data: {
        message: messageDoc,
      },
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
router.delete("/messages/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const messageDoc = await Message.findById(messageId);
    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender for "delete for everyone"
    if (deleteForEveryone && messageDoc.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message for everyone",
      });
    }

    if (deleteForEveryone) {
      await messageDoc.deleteForEveryone();
    } else {
      await messageDoc.deleteForUser(userId);
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Mark messages as seen
// @route   POST /api/chat/room/:roomId/seen
// @access  Private
router.post("/room/:roomId/seen", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom || !hasUserId(chatRoom.participants, userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat room",
      });
    }

    await Message.markMessagesAsSeen(userId, roomId);

    res.json({
      success: true,
      message: "Messages marked as seen",
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:messageId/reactions
// @access  Private
router.post(
  "/messages/:messageId/reactions",
  authenticateToken,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user.id;

      if (!isValidObjectId(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      const messageDoc = await Message.findById(messageId);
      if (!messageDoc) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      await messageDoc.addReaction(userId, emoji);
      await messageDoc.populate(
        "reactions.user",
        "name username profilePicture"
      );

      res.json({
        success: true,
        message: "Reaction added successfully",
        data: {
          message: messageDoc,
        },
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Remove reaction from message
// @route   DELETE /api/chat/messages/:messageId/reactions
// @access  Private
router.delete(
  "/messages/:messageId/reactions",
  authenticateToken,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user.id;

      if (!isValidObjectId(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      const messageDoc = await Message.findById(messageId);
      if (!messageDoc) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      await messageDoc.removeReaction(userId, emoji);
      await messageDoc.populate(
        "reactions.user",
        "name username profilePicture"
      );

      res.json({
        success: true,
        message: "Reaction removed successfully",
        data: {
          message: messageDoc,
        },
      });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalUnread = await Message.getUnreadCount(userId);

    // Get unread count per chat room
    const chatRooms = await ChatRoom.find({ participants: userId });
    const unreadPerRoom = await Promise.all(
      chatRooms.map(async (room) => ({
        roomId: room._id,
        unreadCount: await Message.getUnreadCount(userId, room._id),
      }))
    );

    res.json({
      success: true,
      data: {
        totalUnread,
        unreadPerRoom,
      },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Clear chat room messages
// @route   DELETE /api/chat/room/:roomId/clear
// @access  Private
router.delete("/room/:roomId/clear", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { clearForEveryone = false } = req.body;
    const userId = req.user.id;

    // Verify user is participant in this chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom || !hasUserId(chatRoom.participants, userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat room",
      });
    }

    if (clearForEveryone) {
      // Only admin can clear for everyone
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can clear messages for everyone",
        });
      }
      await Message.deleteMany({ chatRoomId: roomId });
    } else {
      // Clear for current user only
      await Message.updateMany(
        { chatRoomId: roomId },
        { $addToSet: { deletedFor: userId } }
      );
    }

    res.json({
      success: true,
      message: "Chat room cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing chat room:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Get chat statistics (admin only)
// @route   GET /api/chat/stats
// @access  Private (Admin)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const stats = await Message.getMessageStats();
    const totalRooms = await ChatRoom.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        messageStats: stats,
        totalRooms,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// @desc    Report a message
// @route   POST /api/chat/messages/:messageId/report
// @access  Private
router.post(
  "/messages/:messageId/report",
  authenticateToken,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { reason } = req.body;
      const actorId = req.user.id;

      if (!isValidObjectId(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      const messageDoc = await Message.findById(messageId);
      if (!messageDoc) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Add report to admin logs
      messageDoc.adminLogs.push({
        action: "reported",
        actorId,
        reason,
        timestamp: new Date(),
      });
      await messageDoc.save();

      res.json({
        success: true,
        message: "Message reported successfully",
      });
    } catch (error) {
      console.error("Error reporting message:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

module.exports = router;
