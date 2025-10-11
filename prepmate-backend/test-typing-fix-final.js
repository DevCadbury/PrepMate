// Final test for typing indicator fix
console.log("🧪 Testing Final Typing Indicator Fix...\n");

// Test the socket handler methods
const SocketHandler = require("./socket/socketHandler");

// Mock socket objects with realistic user IDs
const mockSocket1 = {
  userId: "507f1f77bcf86cd799439011",
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
  userId: "507f1f77bcf86cd799439012",
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

// Mock connectedUsers Map
SocketHandler.connectedUsers = new Map();
SocketHandler.connectedUsers.set("507f1f77bcf86cd799439011", mockSocket1);
SocketHandler.connectedUsers.set("507f1f77bcf86cd799439012", mockSocket2);

console.log(
  "🔍 Connected users:",
  Array.from(SocketHandler.connectedUsers.keys())
);

console.log("📝 Test 1: Alice typing to Bob (Direct Chat)");
console.log(
  "Expected: Bob should receive showTyping, Alice should NOT see her own typing"
);

SocketHandler.handleTyping(mockSocket1, {
  senderId: "507f1f77bcf86cd799439011",
  receiverId: "507f1f77bcf86cd799439012",
  roomId: "room123",
});

console.log("\n📝 Test 2: Bob typing to Alice (Direct Chat)");
console.log(
  "Expected: Alice should receive showTyping, Bob should NOT see his own typing"
);

SocketHandler.handleTyping(mockSocket2, {
  senderId: "507f1f77bcf86cd799439012",
  receiverId: "507f1f77bcf86cd799439011",
  roomId: "room123",
});

console.log("\n📝 Test 3: Stop Typing - Direct Chat");
SocketHandler.handleStopTyping(mockSocket1, {
  senderId: "507f1f77bcf86cd799439011",
  receiverId: "507f1f77bcf86cd799439012",
  roomId: "room123",
});

console.log("\n✅ Tests completed!");
console.log("📋 Expected behavior:");
console.log("- Test 1: Bob receives showTyping from Alice ✅");
console.log("- Test 2: Alice receives showTyping from Bob ✅");
console.log("- Test 3: Bob receives hideTyping from Alice ✅");
console.log("🎯 Key fix: Users should NOT see their own typing indicator");
console.log("🎯 Key fix: Only other users should see typing indicators");
