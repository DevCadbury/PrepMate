const io = require("socket.io-client");

// Test typing indicator functionality
async function testTypingIndicator() {
  console.log("🧪 Testing Typing Indicator Feature...\n");

  // Connect two test clients
  const client1 = io("http://localhost:5000", {
    auth: {
      token: "test-token-1", // You'll need to generate a real token
    },
  });

  const client2 = io("http://localhost:5000", {
    auth: {
      token: "test-token-2", // You'll need to generate a real token
    },
  });

  // Test 1: Direct chat typing
  console.log("📝 Test 1: Direct Chat Typing");

  client1.on("connect", () => {
    console.log("✅ Client 1 connected");

    // Client 1 starts typing
    client1.emit("typing", {
      senderId: "user1",
      receiverId: "user2",
      roomId: "room123",
    });
  });

  client2.on("connect", () => {
    console.log("✅ Client 2 connected");
  });

  // Client 2 should receive typing indicator
  client2.on("showTyping", (data) => {
    console.log("📤 Client 2 received showTyping:", data);
    console.log("✅ Typing indicator working for direct chat");

    // Simulate client 1 stopping typing after 2 seconds
    setTimeout(() => {
      client1.emit("stopTyping", {
        senderId: "user1",
        receiverId: "user2",
        roomId: "room123",
      });
    }, 2000);
  });

  client2.on("hideTyping", (data) => {
    console.log("📤 Client 2 received hideTyping:", data);
    console.log("✅ Stop typing indicator working for direct chat");
  });

  // Test 2: Group chat typing
  console.log("\n📝 Test 2: Group Chat Typing");

  setTimeout(() => {
    // Join group chat
    client1.emit("join-chat", "group123");
    client2.emit("join-chat", "group123");

    setTimeout(() => {
      // Client 1 starts typing in group
      client1.emit("typing", {
        senderId: "user1",
        groupId: "group123",
        roomId: "group123",
      });
    }, 1000);
  }, 3000);

  client2.on("showTyping", (data) => {
    if (data.groupId) {
      console.log("📤 Client 2 received group showTyping:", data);
      console.log("✅ Typing indicator working for group chat");

      // Simulate client 1 stopping typing after 2 seconds
      setTimeout(() => {
        client1.emit("stopTyping", {
          senderId: "user1",
          groupId: "group123",
          roomId: "group123",
        });
      }, 2000);
    }
  });

  client2.on("hideTyping", (data) => {
    if (data.groupId) {
      console.log("📤 Client 2 received group hideTyping:", data);
      console.log("✅ Stop typing indicator working for group chat");

      // Clean up after tests
      setTimeout(() => {
        console.log("\n🧹 Cleaning up...");
        client1.disconnect();
        client2.disconnect();
        console.log("✅ Tests completed");
        process.exit(0);
      }, 1000);
    }
  });

  // Error handling
  client1.on("error", (error) => {
    console.error("❌ Client 1 error:", error);
  });

  client2.on("error", (error) => {
    console.error("❌ Client 2 error:", error);
  });

  client1.on("disconnect", () => {
    console.log("🔌 Client 1 disconnected");
  });

  client2.on("disconnect", () => {
    console.log("🔌 Client 2 disconnected");
  });
}

// Run the test
testTypingIndicator().catch(console.error);
