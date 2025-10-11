const jwt = require("jsonwebtoken");
const {
  blacklistToken,
  isTokenBlacklisted,
  getBlacklistStats,
} = require("./utils/tokenBlacklist");

// Test the token blacklisting system
async function testTokenBlacklist() {
  console.log("=== TESTING TOKEN BLACKLIST SYSTEM ===");

  // Create a test token that expires in 1 hour
  const payload = {
    id: "test-user-id",
    role: "student",
    uniqueId: "test-unique-id",
    iat: Math.floor(Date.now() / 1000),
    loginTime: Math.floor(Date.now() / 1000),
  };

  const expiresIn = 3600; // 1 hour
  const token = jwt.sign(payload, "test-secret", { expiresIn });

  console.log("1. Created test token:", token.substring(0, 20) + "...");

  // Check if token is blacklisted (should be false)
  const isBlacklisted1 = isTokenBlacklisted(token);
  console.log("2. Token blacklisted before blacklisting:", isBlacklisted1);

  // Blacklist the token
  const decoded = jwt.decode(token);
  const blacklisted = blacklistToken(token, decoded.exp);
  console.log("3. Token blacklisted successfully:", blacklisted);

  // Check if token is blacklisted (should be true)
  const isBlacklisted2 = isTokenBlacklisted(token);
  console.log("4. Token blacklisted after blacklisting:", isBlacklisted2);

  // Get blacklist stats
  const stats = getBlacklistStats();
  console.log("5. Blacklist stats:", stats);

  // Test with a different token
  const token2 = jwt.sign(payload, "test-secret", { expiresIn });
  console.log("6. Created second test token:", token2.substring(0, 20) + "...");

  const isBlacklisted3 = isTokenBlacklisted(token2);
  console.log("7. Second token blacklisted:", isBlacklisted3);

  console.log("=== TEST COMPLETE ===");
}

testTokenBlacklist().catch(console.error);
