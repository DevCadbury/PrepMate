const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../models/User");

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@prepmate.com" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      console.log("Email: admin@prepmate.com");
      console.log("Password: admin123");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Create admin user
    const adminUser = await User.create({
      name: "Super Admin",
      email: "admin@prepmate.com",
      password: hashedPassword,
      role: "admin",
      permissions: [
        "user_management",
        "admin_creation",
        "content_management",
        "analytics_access",
        "system_settings",
      ],
      isActive: true,
      emailVerified: true,
      subscription: "enterprise",
      profile: {
        bio: "Super Administrator of PrepMate Platform",
        company: "PrepMate",
        position: "Super Admin",
        experience: "expert",
      },
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@prepmate.com");
    console.log("Password: admin123");
    console.log("Role: admin");
    console.log("Permissions:", adminUser.permissions);
  } catch (error) {
    console.error("Error setting up admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the setup
setupAdmin();
