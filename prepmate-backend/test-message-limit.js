// Test to verify message limit configuration
console.log("🧪 Testing Message Limit Configuration...\n");

// Test the Message model directly
const mongoose = require("mongoose");
const Message = require("./models/Message");

// Check the schema configuration
console.log("📋 Message Schema Configuration:");
console.log("- maxlength:", Message.schema.paths.message.options.maxlength);
console.log("- required:", Message.schema.paths.message.options.required);
console.log("- trim:", Message.schema.paths.message.options.trim);

// Test creating a message with different lengths
const testLengths = [100, 1000, 5000, 10000, 50000, 60000];

console.log("\n📝 Testing different message lengths:");

testLengths.forEach((length) => {
  const testMessage = "A".repeat(length);
  const message = new Message({
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    chatRoomId: new mongoose.Types.ObjectId(),
    message: testMessage,
    type: "text",
  });

  const validation = message.validateSync();
  if (validation) {
    console.log(
      `❌ ${length} chars: ${
        validation.errors.message?.message || "Validation failed"
      }`
    );
  } else {
    console.log(`✅ ${length} chars: Valid`);
  }
});

console.log("\n🎯 Expected behavior:");
console.log("- 100 chars: ✅ Valid");
console.log("- 1000 chars: ✅ Valid");
console.log("- 5000 chars: ✅ Valid");
console.log("- 10000 chars: ✅ Valid");
console.log("- 50000 chars: ✅ Valid");
console.log("- 60000 chars: ❌ Should fail (over limit)");
