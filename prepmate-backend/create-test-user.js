const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function createTestUser() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate"
    );
    console.log("Connected to MongoDB");

    // Check if test user already exists
    let testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      testUser = new User({
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "testpassword123",
        role: "student",
        isActive: true,
        isOnline: false,
      });

      await testUser.save();
      console.log("✅ Test user created:", testUser._id);
    } else {
      console.log("✅ Test user already exists:", testUser._id);
    }

    // Generate a test token
    const jwt = require("jsonwebtoken");
    const testToken = jwt.sign(
      {
        id: testUser._id.toString(),
        email: testUser.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "1h" }
    );

    console.log("🔑 Test token:", testToken);
    console.log("📝 Use this token in test-socket.js");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

createTestUser();
