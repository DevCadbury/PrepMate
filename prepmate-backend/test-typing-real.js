// Test typing indicator with real user ID format
console.log("🧪 Testing Typing Indicator with Real User IDs...\n");

// Test the socket handler methods
const SocketHandler = require("./socket/socketHandler");

// Mock socket objects with realistic user IDs (MongoDB ObjectId format)
const mockSocket1 = {
  userId: "507f1f77bcf86cd799439011", // MongoDB ObjectId format
  user: { name: "Alice", id: "507f1f77bcf86cd799439011" },
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

const mockSocket2 = {
  userId: "507f1f77bcf86cd799439012", // MongoDB ObjectId format
  user: { name: "Bob", id: "507f1f77bcf86cd799439012" },
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

// Mock connectedUsers Map with realistic user IDs
SocketHandler.connectedUsers = new Map();
SocketHandler.connectedUsers.set("507f1f77bcf86cd799439011", mockSocket1);
SocketHandler.connectedUsers.set("507f1f77bcf86cd799439012", mockSocket2);

console.log(
  "🔍 Connected users:",
  Array.from(SocketHandler.connectedUsers.keys())
);

console.log("📝 Test 1: Alice typing to Bob (Direct Chat)");
console.log("Input data:", {
  senderId: "507f1f77bcf86cd799439011",
  receiverId: "507f1f77bcf86cd799439012",
  roomId: "room123",
});

SocketHandler.handleTyping(mockSocket1, {
  senderId: "507f1f77bcf86cd799439011",
  receiverId: "507f1f77bcf86cd799439012",
  roomId: "room123",
});

console.log("\n📝 Test 2: Bob typing to Alice (Direct Chat)");
SocketHandler.handleTyping(mockSocket2, {
  senderId: "507f1f77bcf86cd799439012",
  receiverId: "507f1f77bcf86cd799439011",
  roomId: "room123",
});

console.log("\n📝 Test 3: Group Chat Typing");
SocketHandler.handleTyping(mockSocket1, {
  senderId: "507f1f77bcf86cd799439011",
  groupId: "group123",
  roomId: "group123",
});

console.log("\n📝 Test 4: Stop Typing - Direct Chat");
SocketHandler.handleStopTyping(mockSocket1, {
  senderId: "507f1f77bcf86cd799439011",
  receiverId: "507f1f77bcf86cd799439012",
  roomId: "room123",
});

console.log("\n✅ Tests completed!");
console.log("📋 Expected behavior:");
console.log("- Test 1: Bob should receive showTyping from Alice");
console.log("- Test 2: Alice should receive showTyping from Bob");
console.log("- Test 3: Both users should receive group typing event");
console.log("- Test 4: Bob should receive hideTyping from Alice");
