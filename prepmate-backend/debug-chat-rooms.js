const mongoose = require("mongoose");
const ChatRoom = require("./models/ChatRoom");
const User = require("./models/User");
require("dotenv").config();

async function debugChatRooms() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate"
    );
    console.log("Connected to MongoDB");

    // Find the current user
    const currentUser = await User.findOne({ email: "prince844121@gmail.com" });
    if (!currentUser) {
      console.log("❌ Current user not found");
      return;
    }
    console.log("✅ Current user:", currentUser.name, "ID:", currentUser._id);

    // Find all chat rooms for this user
    const chatRooms = await ChatRoom.find({
      participants: currentUser._id,
    }).populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    console.log(`\n📊 Found ${chatRooms.length} chat rooms:`);

    chatRooms.forEach((room, index) => {
      console.log(`\n${index + 1}. Chat Room ID: ${room._id}`);
      console.log(`   Type: ${room.type}`);
      console.log(
        `   Participants: ${room.participants.map((p) => p.name).join(", ")}`
      );
      console.log(`   Created: ${room.createdAt}`);
      console.log(`   Updated: ${room.updatedAt}`);

      if (room.lastMessage) {
        console.log(`   Last Message: ${room.lastMessage.message}`);
      }
    });

    // Check if the Eddie chat room exists
    const eddie = await User.findOne({ name: { $regex: /Eddie/i } });
    if (eddie) {
      console.log(`\n🔍 Looking for chat room with Eddie (${eddie._id}):`);
      const eddieRoom = await ChatRoom.findOne({
        participants: { $all: [currentUser._id, eddie._id] },
        type: "direct",
      });

      if (eddieRoom) {
        console.log("✅ Eddie chat room found:", eddieRoom._id);
        console.log("   Participants:", eddieRoom.participants);
      } else {
        console.log("❌ Eddie chat room not found");
      }
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error debugging chat rooms:", error);
  }
}

debugChatRooms();
