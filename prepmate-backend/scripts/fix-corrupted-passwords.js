const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

const User = require("../models/User");

function generateTempPassword() {
  return crypto.randomBytes(8).toString("hex");
}

async function fixCorruptedPasswords() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // List of emails that have double-hashed passwords
  const corruptedEmails = [
    "prince844121@gmail.com",
    "test@example.com",
    "smoke.1775735251083@example.com",
    "smoke.1775735298632@example.com",
    "admin-test@example.com",
    "privatefollow@example.com",
    "csechaman2512@gmail.com",
    "lordwarrior844121@gmail.com"
  ];

  let fixed = 0;
  let failed = 0;

  for (const email of corruptedEmails) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log(`Not found: ${email}`);
        failed++;
        continue;
      }

      const tempPassword = generateTempPassword();
      console.log(`\nFixing: ${email}`);
      console.log(`  Temp password: ${tempPassword}`);

      // The pre-save hook will hash this once
      user.password = tempPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.log(`  -> Password reset successfully`);

      // TODO: Send email to user with temp password
      // For now, just log it
      console.log(`  -> Email would be sent with temp password`);

      fixed++;
    } catch (error) {
      console.log(`Error fixing ${email}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Failed: ${failed}`);

  await mongoose.disconnect();
  console.log("Done");
}

fixCorruptedPasswords().catch(console.error);