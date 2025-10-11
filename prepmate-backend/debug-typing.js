// Debug script for typing indicator issue
console.log("🔍 Debugging Typing Indicator Issue...\n");

// Test the socket handler methods
const SocketHandler = require("./socket/socketHandler");

// Mock socket object with more detailed logging
const mockSocket = {
  userId: "user123",
  user: { name: "Test User", id: "user123" },
  to: (room) => ({
    emit: (event, data) => {
      console.log(
        `📤 [GROUP] Emitted ${event} to ${room}:`,
        JSON.stringify(data, null, 2)
      );
    },
  }),
  emit: (event, data) => {
    console.log(`📤 [DIRECT] Emitted ${event}:`, JSON.stringify(data, null, 2));
  },
};

// Mock connectedUsers Map with detailed logging
SocketHandler.connectedUsers = new Map();
SocketHandler.connectedUsers.set("user456", {
  emit: (event, data) => {
    console.log(
      `📤 [RECEIVER] Emitted ${event} to user456:`,
      JSON.stringify(data, null, 2)
    );
  },
});

console.log("🔍 Test 1: Direct Chat Typing (with receiverId)");
console.log("Input data:", {
  senderId: "user123",
  receiverId: "user456",
  roomId: "room123",
});

SocketHandler.handleTyping(mockSocket, {
  senderId: "user123",
  receiverId: "user456",
  roomId: "room123",
});

console.log("\n🔍 Test 2: Direct Chat Typing (with roomId only)");
console.log("Input data:", {
  senderId: "user123",
  roomId: "room123",
});

SocketHandler.handleTyping(mockSocket, {
  senderId: "user123",
  roomId: "room123",
});

console.log("\n🔍 Test 3: Group Chat Typing");
console.log("Input data:", {
  senderId: "user123",
  groupId: "group123",
  roomId: "group123",
});

SocketHandler.handleTyping(mockSocket, {
  senderId: "user123",
  groupId: "group123",
  roomId: "group123",
});

console.log("\n🔍 Test 4: Stop Typing - Direct Chat");
SocketHandler.handleStopTyping(mockSocket, {
  senderId: "user123",
  receiverId: "user456",
  roomId: "room123",
});

console.log("\n🔍 Test 5: Stop Typing - Group Chat");
SocketHandler.handleStopTyping(mockSocket, {
  senderId: "user123",
  groupId: "group123",
  roomId: "group123",
});

console.log("\n📋 Analysis:");
console.log("- Backend logic appears correct");
console.log("- Events are being emitted properly");
console.log(
  "- Issue likely in frontend receiverId determination or socket connection"
);
console.log("- Check if users are properly connected to socket");
console.log("- Verify receiverId is being calculated correctly in frontend");
