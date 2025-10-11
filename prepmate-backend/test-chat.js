const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock user data for testing
const mockUsers = [
  {
    _id: "1",
    name: "John Doe",
    username: "johndoe",
    profilePicture: "https://example.com/avatar1.jpg",
    isActive: true,
  },
  {
    _id: "2",
    name: "Jane Smith",
    username: "janesmith",
    profilePicture: "https://example.com/avatar2.jpg",
    isActive: true,
  },
];

// Mock chat rooms
const mockChatRooms = [
  {
    _id: "room1",
    participants: ["1", "2"],
    type: "direct",
    lastMessage: {
      _id: "msg1",
      message: "Hello!",
      senderId: "1",
      createdAt: new Date(),
    },
    unreadCount: 0,
  },
];

// Mock messages
const mockMessages = [
  {
    _id: "msg1",
    senderId: {
      _id: "1",
      name: "John Doe",
      profilePicture: "https://example.com/avatar1.jpg",
    },
    message: "Hello!",
    status: "seen",
    isEdited: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "msg2",
    senderId: {
      _id: "2",
      name: "Jane Smith",
      profilePicture: "https://example.com/avatar2.jpg",
    },
    message: "Hi there!",
    status: "seen",
    isEdited: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  },
];

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: "1" };
  next();
};

// Test chat rooms endpoint
app.get("/api/chat/rooms", mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      chatRooms: mockChatRooms.map((room) => ({
        ...room,
        participants: room.participants
          .map((id) => mockUsers.find((user) => user._id === id))
          .filter(Boolean),
      })),
    },
  });
});

// Test messages endpoint
app.get("/api/chat/room/:roomId/messages", mockAuth, (req, res) => {
  const { roomId } = req.params;

  if (roomId === "room1") {
    res.json({
      success: true,
      data: {
        messages: mockMessages,
      },
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Chat room not found",
    });
  }
});

// Test seen endpoint
app.post("/api/chat/room/:roomId/seen", mockAuth, (req, res) => {
  res.json({
    success: true,
    message: "Messages marked as seen",
  });
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Chat test server is working!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Chat test server running on port ${PORT}`);
  console.log("Test endpoints:");
  console.log("- GET /api/chat/rooms");
  console.log("- GET /api/chat/room/room1/messages");
  console.log("- POST /api/chat/room/room1/seen");
});
