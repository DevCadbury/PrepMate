const io = require("socket.io-client");

// Test Socket.IO connection with valid token
const socket = io("http://localhost:5000", {
  auth: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTAzYzA0Y2I1MWU2ZGZjMWVkMWY4YSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc1NDI4MzAxMywiZXhwIjoxNzU0Mjg2NjEzfQ.U3EKWeWg4cAcws7kxMbSCvtSVMFa2_q9r4qukTaWQ04",
  },
  transports: ["websocket", "polling"],
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server");
  console.log("Socket ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket.IO connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Disconnected:", reason);
});

// Test basic socket events
setTimeout(() => {
  if (socket.connected) {
    console.log("📤 Testing basic socket connection...");
    socket.emit("test", { message: "Hello from test client" });
  }
}, 2000);

// Cleanup after 5 seconds
setTimeout(() => {
  console.log("🧹 Cleaning up...");
  socket.disconnect();
  process.exit(0);
}, 5000);
