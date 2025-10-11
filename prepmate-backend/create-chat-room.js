const mongoose = require("mongoose");
const User = require("./models/User");
const ChatRoom = require("./models/ChatRoom");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function createChatRoom() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate"
    );
    console.log("Connected to MongoDB");

    // Find the current user (prince)
    const currentUser = await User.findOne({ email: "prince844121@gmail.com" });
    if (!currentUser) {
      console.log("❌ Current user not found");
      return;
    }
    console.log("✅ Current user found:", currentUser.name);

    // Find Eddie
    const eddie = await User.findOne({ name: { $regex: /Eddie/i } });
    if (!eddie) {
      console.log("❌ Eddie not found");
      return;
    }
    console.log("✅ Eddie found:", eddie.name);

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [currentUser._id, eddie._id] },
      type: "direct",
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        participants: [currentUser._id, eddie._id],
        type: "direct",
        createdBy: currentUser._id,
      });
      await chatRoom.save();
      console.log("✅ Chat room created:", chatRoom._id);
    } else {
      console.log("✅ Chat room already exists:", chatRoom._id);
    }

    // Populate participants
    await chatRoom.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    console.log("📝 Chat room details:");
    console.log("- ID:", chatRoom._id);
    console.log("- Type:", chatRoom.type);
    console.log(
      "- Participants:",
      chatRoom.participants.map((p) => p.name)
    );

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error creating chat room:", error);
  }
}

createChatRoom();
