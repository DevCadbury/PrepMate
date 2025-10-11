const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

// Create a test token for the existing user
const testToken = jwt.sign(
  {
    id: "688bdbcf0999b57049633cc3", // This is the user ID from the logs
    email: "prince844121@gmail.com",
  },
  "280bd182e935f313aaf2ada648e88590347323aa6b801f90789ae81b3b7b418d4f206f8eb89835c5b5ee1fef1200df091c00f00e6467fa99ff57c16f47380e4d",
  { expiresIn: "1h" }
);

const BASE_URL = "http://localhost:5000/api";

async function testChatAPI() {
  console.log("🧪 Testing Chat API...");

  const headers = {
    Authorization: `Bearer ${testToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Test 1: Get chat rooms
    console.log("\n1. Testing GET /api/chat/rooms");
    const roomsResponse = await fetch(`${BASE_URL}/chat/rooms`, {
      method: "GET",
      headers,
    });

    if (roomsResponse.ok) {
      const roomsData = await roomsResponse.json();
      console.log("✅ Chat rooms fetched successfully");
      console.log(
        "📊 Found",
        roomsData.data?.chatRooms?.length || 0,
        "chat rooms"
      );

      if (roomsData.data?.chatRooms?.length > 0) {
        console.log("📝 Sample chat room:", {
          id: roomsData.data.chatRooms[0]._id,
          type: roomsData.data.chatRooms[0].type,
          participants: roomsData.data.chatRooms[0].participants?.length || 0,
        });
      }
    } else {
      console.log("❌ Failed to fetch chat rooms:", roomsResponse.status);
    }

    // Test 2: Get users
    console.log("\n2. Testing GET /api/users");
    const usersResponse = await fetch(`${BASE_URL}/users`, {
      method: "GET",
      headers,
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log("✅ Users fetched successfully");
      console.log("📊 Found", usersData.data?.users?.length || 0, "users");

      if (usersData.data?.users?.length > 0) {
        const eddie = usersData.data.users.find((u) =>
          u.name?.includes("Eddie")
        );
        if (eddie) {
          console.log("👤 Found Eddie:", {
            id: eddie._id,
            name: eddie.name,
            email: eddie.email,
          });
        }
      }
    } else {
      console.log("❌ Failed to fetch users:", usersResponse.status);
    }

    // Test 3: Create a chat room with Eddie (if found)
    console.log("\n3. Testing POST /api/chat/room");
    const eddieId = "688de02fbc7b7e48caa4a075"; // Eddie's ID from logs

    const createRoomResponse = await fetch(`${BASE_URL}/chat/room`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participantId: eddieId,
      }),
    });

    if (createRoomResponse.ok) {
      const roomData = await createRoomResponse.json();
      console.log("✅ Chat room created/found successfully");
      console.log("📝 Chat room:", {
        id: roomData.data?.chatRoom?._id,
        type: roomData.data?.chatRoom?.type,
        participants: roomData.data?.chatRoom?.participants?.length || 0,
      });

      // Test 4: Get messages for this room
      if (roomData.data?.chatRoom?._id) {
        console.log("\n4. Testing GET /api/chat/room/:roomId/messages");
        const messagesResponse = await fetch(
          `${BASE_URL}/chat/room/${roomData.data.chatRoom._id}/messages`,
          {
            method: "GET",
            headers,
          }
        );

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log("✅ Messages fetched successfully");
          console.log(
            "📊 Found",
            messagesData.data?.messages?.length || 0,
            "messages"
          );
        } else {
          console.log("❌ Failed to fetch messages:", messagesResponse.status);
        }
      }
    } else {
      console.log("❌ Failed to create chat room:", createRoomResponse.status);
      const errorData = await createRoomResponse.json();
      console.log("Error details:", errorData);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testChatAPI();
