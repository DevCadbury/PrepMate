const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Get dashboard data
router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const pendingUsers = await User.countDocuments({
        isActive: false,
        emailVerified: false,
      });
      const suspendedUsers = await User.countDocuments({
        isActive: false,
        emailVerified: true,
      });

      const users = await User.find()
        .select("name email role isActive createdAt subscription googleId")
        .sort({ createdAt: -1 });

      const stats = {
        totalUsers,
        activeUsers,
        totalRevenue: 150000, // Mock data
        monthlyGrowth: 12.5, // Mock data
        pendingUsers,
        suspendedUsers,
      };

      const mappedUsers = users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isActive
          ? "active"
          : user.emailVerified
          ? "suspended"
          : "pending",
        joinDate: user.createdAt,
        lastLogin: user.lastLogin || user.createdAt,
        subscription: user.subscription || "Free",
        permissions: user.permissions || [],
        googleLinked: !!user.googleId,
      }));

      res.json({
        success: true,
        stats,
        users: mappedUsers,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Suspend user
router.post(
  "/users/:userId/suspend",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive: false },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User suspended successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Activate user
router.post(
  "/users/:userId/activate",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive: true },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User activated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Delete user
router.post(
  "/users/:userId/delete",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Update user role
router.put(
  "/users/:userId/role",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User role updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Update user permissions
router.put(
  "/users/:userId/permissions",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { permissions } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { permissions },
        { new: true }
      );
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        message: "User permissions updated successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Generate admin token
router.post(
  "/generate-token",
  authenticateToken,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      // Check if user has permission to create admins
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.permissions?.includes("admin_creation")) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to create admin accounts",
        });
      }

      // Generate a secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database (you might want to create a separate AdminToken model)
      // For now, we'll just return the token
      res.json({
        success: true,
        token: `admin_${token}`,
        expiresAt,
        message: "Admin token generated successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Create admin with token
router.post("/create-admin", async (req, res) => {
  try {
    const { token, name, email, password } = req.body;

    // Validate token (in real app, check against stored tokens)
    if (!token.startsWith("admin_")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid admin token" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create new admin user
    const adminUser = new User({
      name,
      email,
      password,
      role: "admin",
      isActive: true,
      emailVerified: true,
      permissions: ["user_management", "analytics_view"], // Default permissions
    });

    await adminUser.save();

    res.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
