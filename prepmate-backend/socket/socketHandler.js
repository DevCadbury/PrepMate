const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");
const logger = require("../utils/logger");

class SocketHandler {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socket
    this.userRooms = new Map(); // userId -> roomId
    this.rooms = new Map(); // roomId -> { users: Set, type: string }
  }

  // Initialize socket handler
  initialize(io) {
    this.io = io;

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
          return next(new Error("User not found or inactive"));
        }

        socket.userId = user._id.toString();
        socket.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl,
        };

        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
      }
    });

    // Connection handler
    io.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  // Handle new connection
  handleConnection(socket) {
    const { userId, user } = socket;

    logger.info(`User connected: ${user.name} (${userId})`);

    // Store connected user
    this.connectedUsers.set(userId, socket);
    console.log("🔍 [CONNECTION] User connected and stored:", {
      userId,
      userName: user.name,
      connectedUsersCount: this.connectedUsers.size,
      connectedUserIds: Array.from(this.connectedUsers.keys()),
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Update user's online status
    this.updateUserStatus(userId, true);

    // Handle disconnection
    socket.on("disconnect", () => {
      this.handleDisconnection(socket);
    });

    // Handle chat messages
    socket.on("send_message", (data) => {
      this.handleSendMessage(socket, data);
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      this.handleTyping(socket, data);
    });

    socket.on("stopTyping", (data) => {
      this.handleStopTyping(socket, data);
    });

    // Handle typing indicators (legacy events for backward compatibility)
    socket.on("typing_start", (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on("typing_stop", (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle user mentions
    socket.on("user-mentioned", (data) => {
      this.handleUserMentioned(socket, data);
    });

    // Handle video call signaling
    socket.on("call_offer", (data) => {
      this.handleCallOffer(socket, data);
    });

    socket.on("call_answer", (data) => {
      this.handleCallAnswer(socket, data);
    });

    socket.on("call_ice_candidate", (data) => {
      this.handleCallIceCandidate(socket, data);
    });

    // Handle post interactions
    socket.on("join-post", (postId) => {
      this.handleJoinPost(socket, postId);
    });

    socket.on("leave-post", (postId) => {
      this.handleLeavePost(socket, postId);
    });

    socket.on("like-post", (data) => {
      this.handleLikePost(socket, data);
    });

    socket.on("new-comment", (data) => {
      this.handleNewComment(socket, data);
    });

    socket.on("like-comment", (data) => {
      this.handleLikeComment(socket, data);
    });

    // Handle chat interactions
    socket.on("join-chat", (roomId) => {
      this.handleJoinChat(socket, roomId);
    });

    socket.on("leave-chat", (roomId) => {
      this.handleLeaveChat(socket, roomId);
    });

    socket.on("send-message", (data) => {
      this.handleSendMessage(socket, data);
    });

    socket.on("seen-message", (data) => {
      this.handleSeenMessage(socket, data);
    });

    socket.on("edit-message", (data) => {
      this.handleEditMessage(socket, data);
    });

    socket.on("delete-message", (data) => {
      this.handleDeleteMessage(socket, data);
    });

    socket.on("react-to-message", (data) => {
      this.handleReactToMessage(socket, data);
    });

    socket.on("call_end", (data) => {
      this.handleCallEnd(socket, data);
    });

    // Handle room joining
    socket.on("join_room", (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on("leave_room", (data) => {
      this.handleLeaveRoom(socket, data);
    });

    // Handle notifications
    socket.on("mark_notification_read", (data) => {
      this.handleMarkNotificationRead(socket, data);
    });

    // Handle presence
    socket.on("update_presence", (data) => {
      this.handleUpdatePresence(socket, data);
    });
  }

  // Handle disconnection
  handleDisconnection(socket) {
    const { userId, user } = socket;

    logger.info(`User disconnected: ${user.name} (${userId})`);

    // Remove from connected users
    this.connectedUsers.delete(userId);

    // Leave all rooms
    this.leaveAllRooms(socket);

    // Update user's online status
    this.updateUserStatus(userId, false);

    // Notify other users
    this.io.emit("user_offline", {
      userId,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    });
  }

  // Handle sending chat messages

  // Handle typing indicators
  handleTypingStart(socket, data) {
    const { recipientId } = data;
    const { userId, user } = socket;

    const recipientSocket = this.connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("user_typing", {
        userId,
        user: {
          id: user.id,
          name: user.name,
        },
      });
    }
  }

  handleTypingStop(socket, data) {
    const { recipientId } = data;
    const { userId } = socket;

    const recipientSocket = this.connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("user_stopped_typing", { userId });
    }
  }

  // Handle video call signaling
  handleCallOffer(socket, data) {
    const { recipientId, offer, roomId } = data;
    const { userId, user } = socket;

    const recipientSocket = this.connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("call_offer", {
        callerId: userId,
        caller: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        offer,
        roomId,
      });
    }
  }

  handleCallAnswer(socket, data) {
    const { callerId, answer } = data;
    const { userId, user } = socket;

    const callerSocket = this.connectedUsers.get(callerId);
    if (callerSocket) {
      callerSocket.emit("call_answer", {
        answererId: userId,
        answerer: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        answer,
      });
    }
  }

  handleCallIceCandidate(socket, data) {
    const { recipientId, candidate } = data;
    const { userId } = socket;

    const recipientSocket = this.connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("call_ice_candidate", {
        senderId: userId,
        candidate,
      });
    }
  }

  handleCallEnd(socket, data) {
    const { recipientId, reason } = data;
    const { userId } = socket;

    const recipientSocket = this.connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("call_end", {
        senderId: userId,
        reason,
      });
    }
  }

  // Handle room management
  handleJoinRoom(socket, data) {
    const { roomId, roomType = "chat" } = data;
    const { userId, user } = socket;

    socket.join(roomId);
    this.userRooms.set(userId, roomId);

    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Set(),
        type: roomType,
      });
    }

    this.rooms.get(roomId).users.add(userId);

    // Notify other users in the room
    socket.to(roomId).emit("user_joined_room", {
      userId,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      roomId,
    });

    logger.info(`User ${user.name} joined room ${roomId}`);
  }

  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    const { userId, user } = socket;

    socket.leave(roomId);
    this.userRooms.delete(userId);

    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).users.delete(userId);

      // Remove room if empty
      if (this.rooms.get(roomId).users.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Notify other users in the room
    socket.to(roomId).emit("user_left_room", {
      userId,
      user: {
        id: user.id,
        name: user.name,
      },
      roomId,
    });

    logger.info(`User ${user.name} left room ${roomId}`);
  }

  // Handle notifications
  handleMarkNotificationRead(socket, data) {
    const { notificationId } = data;
    const { userId } = socket;

    // Mark notification as read in database
    // This would typically update a notifications collection
    logger.info(`User ${userId} marked notification ${notificationId} as read`);
  }

  // Handle presence updates
  handleUpdatePresence(socket, data) {
    const { status, customStatus } = data;
    const { userId, user } = socket;

    // Update user's presence in database
    // This would typically update the user's status

    // Broadcast to relevant users
    this.io.emit("user_presence_updated", {
      userId,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      status,
      customStatus,
    });

    logger.info(`User ${user.name} updated presence: ${status}`);
  }

  // Post interaction handlers
  handleJoinPost(socket, postId) {
    socket.join(`post:${postId}`);
    logger.info(`User ${socket.user.name} joined post ${postId}`);
  }

  handleLeavePost(socket, postId) {
    socket.leave(`post:${postId}`);
    logger.info(`User ${socket.user.name} left post ${postId}`);
  }

  handleLikePost(socket, data) {
    const { postId, action } = data;

    // Broadcast to all users viewing this post
    socket
      .to(`post:${postId}`)
      .emit(action === "like" ? "post-liked" : "post-unliked", {
        postId,
        userId: socket.userId,
        userName: socket.user.name,
      });

    logger.info(`User ${socket.user.name} ${action}ed post ${postId}`);
  }

  handleNewComment(socket, data) {
    const { postId, comment } = data;

    // Broadcast to all users viewing this post
    socket.to(`post:${postId}`).emit("new-comment", {
      postId,
      comment: {
        ...comment,
        user: {
          _id: socket.userId,
          name: socket.user.name,
          username: socket.user.username || socket.user.name,
          profilePicture: socket.user.avatar,
        },
      },
    });

    logger.info(`User ${socket.user.name} commented on post ${postId}`);
  }

  handleLikeComment(socket, data) {
    const { commentId, postId } = data;

    // Broadcast to all users viewing this post
    socket.to(`post:${postId}`).emit("comment-liked", {
      commentId,
      postId,
      userId: socket.userId,
      userName: socket.user.name,
    });

    logger.info(`User ${socket.user.name} liked comment ${commentId}`);
  }

  // Chat interaction handlers
  handleJoinChat(socket, roomId) {
    socket.join(`chat:${roomId}`);
    logger.info(`User ${socket.user.name} joined chat ${roomId}`);
  }

  handleLeaveChat(socket, roomId) {
    socket.leave(`chat:${roomId}`);
    logger.info(`User ${socket.user.name} left chat ${roomId}`);
  }

  async handleSendMessage(socket, data) {
    try {
      const { roomId, message, type = "text", replyTo, media } = data;
      const { userId, user } = socket;

      // Validate message length
      if (!message || message.trim().length === 0) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      if (message.length > 50000) {
        socket.emit("error", {
          message: "Message is too long. Maximum 50,000 characters allowed.",
        });
        return;
      }

      // Validate chat room access
      const ChatRoom = require("../models/ChatRoom");
      const chatRoom = await ChatRoom.findById(roomId);

      if (!chatRoom || !chatRoom.participants.includes(userId)) {
        socket.emit("error", { message: "Access denied to this chat room" });
        return;
      }

      // Get receiver ID
      const receiverId = chatRoom.participants.find(
        (participant) => participant.toString() !== userId
      );

      if (!receiverId) {
        socket.emit("error", { message: "Invalid chat room" });
        return;
      }

      // Create message
      const Message = require("../models/Message");
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

      // Emit to sender
      socket.emit("message-sent", {
        messageId: newMessage._id,
        message: newMessage,
      });

      // Emit to receiver
      const receiverSocket = this.connectedUsers.get(receiverId.toString());
      if (receiverSocket) {
        receiverSocket.emit("new-message", {
          message: newMessage,
        });
      }

      // Broadcast to chat room
      socket.to(`chat:${roomId}`).emit("message-received", {
        message: newMessage,
      });

      logger.info(
        `User ${user.name} sent message in chat ${roomId} (length: ${message.length})`
      );
    } catch (error) {
      logger.error("Error handling send message:", error);

      // Provide more specific error messages
      if (error.name === "ValidationError") {
        socket.emit("error", {
          message: "Message validation failed. Please check the content.",
        });
      } else if (error.code === 11000) {
        socket.emit("error", { message: "Duplicate message detected." });
      } else {
        socket.emit("error", {
          message: "Failed to send message. Please try again.",
        });
      }
    }
  }

  handleTyping(socket, data) {
    const { roomId, senderId, receiverId, groupId } = data;
    const { userId, user } = socket;

    console.log("🔍 [BACKEND] handleTyping called:", {
      roomId,
      senderId,
      receiverId,
      groupId,
      userId,
      userName: user.name,
      connectedUsersCount: this.connectedUsers.size,
      connectedUserIds: Array.from(this.connectedUsers.keys()),
    });

    // Broadcast to receiver or group
    if (groupId) {
      // Group chat - broadcast to all participants except sender
      console.log("🔍 [BACKEND] Broadcasting to group:", groupId);
      socket.to(`chat:${groupId}`).emit("showTyping", {
        senderId: userId,
        senderName: user.name,
        groupId,
      });
    } else if (receiverId) {
      // Direct chat - send to specific receiver
      const receiverSocket = this.connectedUsers.get(receiverId);
      console.log(
        "🔍 [BACKEND] Direct chat - receiverId:",
        receiverId,
        "receiverSocket:",
        !!receiverSocket
      );
      if (receiverSocket) {
        receiverSocket.emit("showTyping", {
          senderId: userId,
          senderName: user.name,
          receiverId,
        });
      } else {
        console.log(
          "🔍 [BACKEND] WARNING: Receiver not found in connectedUsers"
        );
      }
    } else if (roomId) {
      // Fallback to room-based broadcasting
      console.log("🔍 [BACKEND] Fallback to room-based broadcasting:", roomId);
      socket.to(`chat:${roomId}`).emit("showTyping", {
        senderId: userId,
        senderName: user.name,
        roomId,
      });
    }

    logger.info(
      `User ${user.name} is typing in ${groupId ? "group" : "chat"} ${
        groupId || receiverId || roomId
      }`
    );
  }

  handleStopTyping(socket, data) {
    const { roomId, senderId, receiverId, groupId } = data;
    const { userId, user } = socket;

    // Broadcast to receiver or group
    if (groupId) {
      // Group chat - broadcast to all participants except sender
      socket.to(`chat:${groupId}`).emit("hideTyping", {
        senderId: userId,
        senderName: user.name,
        groupId,
      });
    } else if (receiverId) {
      // Direct chat - send to specific receiver
      const receiverSocket = this.connectedUsers.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit("hideTyping", {
          senderId: userId,
          senderName: user.name,
          receiverId,
        });
      }
    } else if (roomId) {
      // Fallback to room-based broadcasting
      socket.to(`chat:${roomId}`).emit("hideTyping", {
        senderId: userId,
        senderName: user.name,
        roomId,
      });
    }

    logger.info(
      `User ${user.name} stopped typing in ${groupId ? "group" : "chat"} ${
        groupId || receiverId || roomId
      }`
    );
  }

  handleUserMentioned(socket, data) {
    const { roomId, mentionedUserId, mentionedBy, message } = data;

    // Send notification to the mentioned user
    this.sendToUser(mentionedUserId, "user-mentioned", {
      roomId,
      mentionedUserId,
      mentionedBy: socket.user.name,
      message,
    });

    // Log the mention
    logger.info(
      `User ${socket.user.name} mentioned user ${mentionedUserId} in room ${roomId}`
    );
  }

  async handleSeenMessage(socket, data) {
    try {
      const { roomId } = data;
      const { userId } = socket;

      const Message = require("../models/Message");
      await Message.markMessagesAsSeen(userId, roomId);

      // Broadcast to chat room
      socket.to(`chat:${roomId}`).emit("messages-seen", {
        userId,
        roomId,
      });

      logger.info(
        `User ${socket.user.name} marked messages as seen in chat ${roomId}`
      );
    } catch (error) {
      logger.error("Error handling seen message:", error);
      socket.emit("error", { message: "Failed to mark messages as seen" });
    }
  }

  async handleEditMessage(socket, data) {
    try {
      const { messageId, newMessage } = data;
      const { userId, user } = socket;

      const Message = require("../models/Message");
      const messageDoc = await Message.findById(messageId);

      if (!messageDoc) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      // Check if user is the sender
      if (messageDoc.senderId.toString() !== userId) {
        socket.emit("error", {
          message: "Not authorized to edit this message",
        });
        return;
      }

      // Check if message is not too old (within 15 minutes)
      const messageAge = Date.now() - messageDoc.createdAt.getTime();
      if (messageAge > 15 * 60 * 1000) {
        socket.emit("error", {
          message: "Cannot edit messages older than 15 minutes",
        });
        return;
      }

      // Edit message
      await messageDoc.editMessage(newMessage);

      // Add admin log
      messageDoc.adminLogs.push({
        action: "edited",
        timestamp: new Date(),
      });
      await messageDoc.save();

      await messageDoc.populate("senderId", "name username profilePicture");
      await messageDoc.populate("receiverId", "name username profilePicture");

      // Broadcast to chat room
      socket.to(`chat:${messageDoc.chatRoomId}`).emit("message-edited", {
        messageId,
        message: messageDoc,
      });

      logger.info(`User ${user.name} edited message ${messageId}`);
    } catch (error) {
      logger.error("Error handling edit message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  }

  async handleDeleteMessage(socket, data) {
    try {
      const { messageId, deleteForEveryone = false } = data;
      const { userId, user } = socket;

      const Message = require("../models/Message");
      const messageDoc = await Message.findById(messageId);

      if (!messageDoc) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      // Check if user is the sender (for delete for everyone)
      if (deleteForEveryone && messageDoc.senderId.toString() !== userId) {
        socket.emit("error", {
          message: "Not authorized to delete this message for everyone",
        });
        return;
      }

      if (deleteForEveryone) {
        // Delete for everyone
        await messageDoc.deleteForEveryone();

        // Add admin log
        messageDoc.adminLogs.push({
          action: "deleted",
          timestamp: new Date(),
          reason: "Deleted for everyone",
        });
        await messageDoc.save();

        // Broadcast to chat room
        socket.to(`chat:${messageDoc.chatRoomId}`).emit("message-deleted", {
          messageId,
          deleteForEveryone: true,
        });
      } else {
        // Delete for current user only
        await messageDoc.deleteForUser(userId);
      }

      logger.info(`User ${user.name} deleted message ${messageId}`);
    } catch (error) {
      logger.error("Error handling delete message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  }

  async handleReactToMessage(socket, data) {
    try {
      const { messageId, emoji, action = "add" } = data;
      const { userId, user } = socket;

      const Message = require("../models/Message");
      const messageDoc = await Message.findById(messageId);

      if (!messageDoc) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      if (action === "add") {
        await messageDoc.addReaction(userId, emoji);
      } else {
        await messageDoc.removeReaction(userId);
      }

      await messageDoc.populate(
        "reactions.userId",
        "name username profilePicture"
      );

      // Broadcast to chat room
      socket.to(`chat:${messageDoc.chatRoomId}`).emit("message-reacted", {
        messageId,
        reaction: action === "add" ? { userId, emoji } : null,
        message: messageDoc,
      });

      logger.info(
        `User ${user.name} ${action}ed reaction to message ${messageId}`
      );
    } catch (error) {
      logger.error("Error handling message reaction:", error);
      socket.emit("error", { message: "Failed to react to message" });
    }
  }

  // Utility methods
  async getOrCreateChatRoom(user1Id, user2Id) {
    // Find existing chat room
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [user1Id, user2Id] },
      type: "direct",
    });

    // Create new chat room if it doesn't exist
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [user1Id, user2Id],
        type: "direct",
        messages: [],
      });
    }

    return chatRoom;
  }

  leaveAllRooms(socket) {
    const { userId } = socket;
    const roomId = this.userRooms.get(userId);

    if (roomId) {
      socket.leave(roomId);
      this.userRooms.delete(userId);

      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).users.delete(userId);

        if (this.rooms.get(roomId).users.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }

  updateUserStatus(userId, isOnline) {
    // Update user's online status in database
    User.findByIdAndUpdate(userId, {
      $set: { isOnline, lastSeen: new Date() },
    }).catch((error) => {
      logger.error("Error updating user status:", error);
    });
  }

  sendNotification(userId, notification) {
    // Send push notification or store for later delivery
    // This would integrate with a push notification service
    logger.info(`Sending notification to user ${userId}:`, notification);
  }

  // Public methods for external use
  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Export singleton instance
module.exports = new SocketHandler();
