const io = require("socket.io-client");
const jwt = require("jsonwebtoken");

// Create a test token
const testToken = jwt.sign(
  {
    id: "688bdbcf0999b57049633cc3",
    email: "prince844121@gmail.com",
  },
  "280bd182e935f313aaf2ada648e88590347323aa6b801f90789ae81b3b7b418d4f206f8eb89835c5b5ee1fef1200df091c00f00e6467fa99ff57c16f47380e4d",
  { expiresIn: "1h" }
);

console.log("Testing Socket.IO connection...");
console.log("Token:", testToken.substring(0, 50) + "...");

const socket = io("http://localhost:5000", {
  auth: {
    token: testToken,
  },
  transports: ["websocket", "polling"],
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server");
  console.log("Socket ID:", socket.id);

  // Test joining a chat room
  socket.emit("join-chat", "68903db9156d5b0424e1570b");
  console.log("Joined chat room: 68903db9156d5b0424e1570b");

  // Test sending a message
  setTimeout(() => {
    socket.emit("send-message", {
      roomId: "68903db9156d5b0424e1570b",
      message: "Test message from script",
      type: "text",
    });
    console.log("Sent test message");
  }, 1000);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("new-message", (data) => {
  console.log("📨 Received new message:", data);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

// Disconnect after 5 seconds
setTimeout(() => {
  console.log("Disconnecting...");
  socket.disconnect();
  process.exit(0);
}, 5000);
