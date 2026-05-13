/**
 * Migration script to fix null username values in existing users
 * 
 * This script removes null username values so the sparse index works correctly.
 * Run with: node scripts/fix-null-usernames.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/prepmate";
  
  console.log("Connecting to MongoDB...");
  
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function fixNullUsernames() {
  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  console.log("\n=== Fixing Null Username Values ===\n");

  // Find all users with null username
  const usersWithNullUsername = await usersCollection.find({
    username: null
  }).toArray();

  console.log(`Found ${usersWithNullUsername.length} users with null username`);

  if (usersWithNullUsername.length === 0) {
    console.log("No null usernames found. Database is clean!");
    return;
  }

  // Remove null username values using $unset
  const result = await usersCollection.updateMany(
    { username: null },
    { $unset: { username: "" } }
  );

  console.log(`✅ Updated ${result.modifiedCount} documents`);
  console.log(`   Matched: ${result.matchedCount}`);
  console.log(`   Modified: ${result.modifiedCount}`);

  // Verify the fix
  const remainingNullUsers = await usersCollection.find({
    username: null
  }).toArray();

  console.log(`\nRemaining users with null username: ${remainingNullUsers.length}`);

  if (remainingNullUsers.length > 0) {
    console.log("\n⚠️ Some users still have null usernames:");
    remainingNullUsers.forEach(user => {
      console.log(`   - ${user.email} (${user._id})`);
    });
  }
}

async function dropAndRecreateUsernameIndex() {
  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  console.log("\n=== Managing Username Index ===\n");

  try {
    // Get current indexes
    const indexes = await usersCollection.indexes();
    console.log("Current indexes:");
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if username index exists
    const usernameIndex = indexes.find(idx => idx.key && idx.key.username !== undefined);
    
    if (usernameIndex) {
      console.log(`\nFound username index: ${usernameIndex.name}`);
      
      // Check if it's sparse
      if (usernameIndex.sparse) {
        console.log("✅ Username index is already sparse");
      } else {
        console.log("⚠️ Username index is not sparse - dropping and recreating...");
        
        // Drop the index
        await usersCollection.dropIndex(usernameIndex.name);
        console.log("✅ Dropped old username index");
        
        // Create new sparse index
        await usersCollection.createIndex(
          { username: 1 },
          { 
            unique: true, 
            sparse: true,
            name: "username_1_sparse"
          }
        );
        console.log("✅ Created new sparse username index");
      }
    } else {
      console.log("No username index found. Creating sparse index...");
      
      await usersCollection.createIndex(
        { username: 1 },
        { 
          unique: true, 
          sparse: true,
          name: "username_1_sparse"
        }
      );
      console.log("✅ Created sparse username index");
    }
  } catch (error) {
    console.error("❌ Error managing indexes:", error.message);
    throw error;
  }
}

async function showStats() {
  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  console.log("\n=== Database Statistics ===\n");

  const totalUsers = await usersCollection.countDocuments();
  const usersWithUsername = await usersCollection.countDocuments({ username: { $exists: true, $ne: null } });
  const usersWithoutUsername = await usersCollection.countDocuments({ $or: [{ username: { $exists: false } }, { username: null }] });
  const verifiedUsers = await usersCollection.countDocuments({ emailVerified: true });
  const unverifiedUsers = await usersCollection.countDocuments({ emailVerified: false });

  console.log(`Total users: ${totalUsers}`);
  console.log(`Users with username: ${usersWithUsername}`);
  console.log(`Users without username: ${usersWithoutUsername}`);
  console.log(`Email verified: ${verifiedUsers}`);
  console.log(`Email not verified: ${unverifiedUsers}`);
}

async function main() {
  console.log("=== Username Migration Script ===\n");
  
  await connectDB();
  
  try {
    await showStats();
    await fixNullUsernames();
    await dropAndRecreateUsernameIndex();
    await showStats();
    
    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Restart your application");
    console.log("2. Test the new signup flow");
    console.log("3. The duplicate key error should be resolved");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixNullUsernames, dropAndRecreateUsernameIndex };
