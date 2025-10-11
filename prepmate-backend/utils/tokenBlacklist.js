const jwt = require("jsonwebtoken");
const logger = require("./logger");

// In-memory storage for blacklisted tokens
// In production, this should be replaced with Redis or a database
const blacklistedTokens = new Map();

/**
 * Add a token to the blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresAt - Token expiration timestamp (seconds since epoch)
 */
const blacklistToken = (token, expiresAt) => {
  try {
    // Calculate time until expiration
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = expiresAt - now;

    if (timeToExpiry > 0) {
      // Store token with expiration time
      blacklistedTokens.set(token, expiresAt);

      // Set timeout to remove token from blacklist when it expires
      setTimeout(() => {
        blacklistedTokens.delete(token);
        logger.info(
          `Token removed from blacklist (expired): ${token.substring(0, 20)}...`
        );
      }, timeToExpiry * 1000);

      logger.info(
        `Token blacklisted for ${timeToExpiry} seconds: ${token.substring(
          0,
          20
        )}...`
      );
      return true;
    } else {
      logger.warn(
        `Token already expired, not blacklisting: ${token.substring(0, 20)}...`
      );
      return false;
    }
  } catch (error) {
    logger.error("Error blacklisting token:", error);
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is blacklisted, false otherwise
 */
const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

/**
 * Remove a token from the blacklist
 * @param {string} token - The JWT token to remove from blacklist
 */
const removeFromBlacklist = (token) => {
  if (blacklistedTokens.has(token)) {
    blacklistedTokens.delete(token);
    logger.info(`Token removed from blacklist: ${token.substring(0, 20)}...`);
    return true;
  }
  return false;
};

/**
 * Get blacklist statistics
 * @returns {object} - Statistics about the blacklist
 */
const getBlacklistStats = () => {
  return {
    totalBlacklisted: blacklistedTokens.size,
    blacklistedTokens: Array.from(blacklistedTokens.keys()).map((token) => ({
      token: token.substring(0, 20) + "...",
      expiresAt: blacklistedTokens.get(token),
    })),
  };
};

/**
 * Clear all blacklisted tokens (useful for testing)
 */
const clearBlacklist = () => {
  const size = blacklistedTokens.size;
  blacklistedTokens.clear();
  logger.info(`Cleared ${size} tokens from blacklist`);
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  removeFromBlacklist,
  getBlacklistStats,
  clearBlacklist,
};
