const io = require("socket.io-client");

// Test long message functionality
console.log("🧪 Testing Long Message Functionality...\n");

// Create a test message that's longer than the old limit but within new limit
const testMessage = "A".repeat(10000); // 10,000 characters
console.log(`📝 Test message length: ${testMessage.length} characters`);
console.log(`📝 Message preview: ${testMessage.substring(0, 50)}...`);

// Test socket connection
const socket = io("http://localhost:5000", {
  auth: {
    token: "test-token", // This will fail auth but we can test the connection
  },
});

socket.on("connect", () => {
  console.log("✅ Socket connected successfully");

  // Test sending a message
  socket.emit("send-message", {
    roomId: "test-room",
    message: testMessage,
    type: "text",
  });

  console.log("📤 Test message sent");
});

socket.on("error", (error) => {
  console.log("❌ Socket error:", error);
});

socket.on("message-sent", (data) => {
  console.log("✅ Message sent successfully:", data);
});

socket.on("disconnect", () => {
  console.log("🔌 Socket disconnected");
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log("\n⏰ Test completed");
  socket.disconnect();
  process.exit(0);
}, 5000);
