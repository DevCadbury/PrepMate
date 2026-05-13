const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

async function verifyUser() {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: "lordwarrior844121@gmail.com" }).select("+password");

  if (user) {
    console.log("User found:", user.email);
    console.log("Password hash:", user.password);
    console.log("Password length:", user.password.length);

    const result = await bcrypt.compare("708e6fdf005a1f27", user.password);
    console.log("Temp password works:", result);
  } else {
    console.log("User not found");
  }

  await mongoose.disconnect();
}

verifyUser().catch(console.error);