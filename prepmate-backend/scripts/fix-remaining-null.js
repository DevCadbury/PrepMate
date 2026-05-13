require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate"
    );

    const db = mongoose.connection.db;

    console.log("\n=== CHECKING USERS ===\n");

    // Find documents where username is either null OR missing
    const usersWithoutUsername = await db.collection("users")
      .find({
        $or: [
          { username: { $exists: false } },
          { username: null }
        ]
      })
      .project({
        email: 1,
        username: 1,
        emailVerified: 1
      })
      .toArray();

    console.log(
      "Users without username field or with null username:\n",
      JSON.stringify(usersWithoutUsername, null, 2)
    );

    console.log("\n=== REMOVING EXPLICIT NULL USERNAMES ===\n");

    // Remove ONLY explicit null values
    const unsetResult = await db.collection("users").updateMany(
      {
        username: {
          $exists: true,
          $eq: null
        }
      },
      {
        $unset: {
          username: ""
        }
      }
    );

    console.log("Modified documents:", unsetResult.modifiedCount);

    console.log("\n=== VERIFYING FIX ===\n");

    // Check for explicit null values only
    const explicitNulls = await db.collection("users").find({
      username: {
        $exists: true,
        $type: "null"
      }
    }).toArray();

    console.log("Remaining explicit null usernames:", explicitNulls.length);

    // Count users that truly have usernames
    const usersWithUsername = await db.collection("users").countDocuments({
      username: {
        $exists: true,
        $ne: null
      }
    });

    console.log("Users WITH username:", usersWithUsername);

    console.log("\n=== CHECKING INDEXES ===\n");

    const indexes = await db.collection("users").indexes();

    console.log(JSON.stringify(indexes, null, 2));

    const usernameIndex = indexes.find(
      idx => idx.key && idx.key.username !== undefined
    );

    if (!usernameIndex) {
      console.log("Username index not found");
    } else {
      console.log("Username index info:");
      console.log({
        name: usernameIndex.name,
        unique: usernameIndex.unique || false,
        sparse: usernameIndex.sparse || false
      });

      // Fix old non-sparse unique index
      if (usernameIndex.unique && !usernameIndex.sparse) {
        console.log(
          "\nOld non-sparse unique index detected. Rebuilding..."
        );

        await db.collection("users").dropIndex(usernameIndex.name);

        await db.collection("users").createIndex(
          { username: 1 },
          {
            unique: true,
            sparse: true
          }
        );

        console.log("Sparse unique index recreated successfully");
      }
    }

    console.log("\n=== FINAL VERIFICATION ===\n");

    const sampleUser = await db.collection("users").findOne({
      email: "csechaman2512@gmail.com"
    });

    console.log("Sample user:");
    console.log(sampleUser);

    console.log(
      "Has username field:",
      Object.hasOwn(sampleUser, "username")
    );

    console.log("\n=== DONE ===\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Fix script failed:");
    console.error(error);

    await mongoose.disconnect();
    process.exit(1);
  }
}

fix();