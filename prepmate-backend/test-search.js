const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock user data for testing
const mockUsers = [
  {
    _id: "1",
    name: "John Doe",
    username: "johndoe",
    profilePicture: "https://example.com/avatar1.jpg",
    isActive: true,
  },
  {
    _id: "2",
    name: "Jane Smith",
    username: "janesmith",
    profilePicture: "https://example.com/avatar2.jpg",
    isActive: true,
  },
  {
    _id: "3",
    name: "Bob Johnson",
    username: "bobjohnson",
    profilePicture: "https://example.com/avatar3.jpg",
    isActive: true,
  },
];

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: "current-user-id" };
  next();
};

// Test search endpoint
app.get("/api/users/search", mockAuth, (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;

  if (!q || typeof q !== "string") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  if (q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search query must be at least 2 characters",
    });
  }

  // Search by username or name (case-insensitive)
  const searchRegex = new RegExp(q.trim(), "i");
  const users = mockUsers.filter(
    (user) =>
      (user.username.match(searchRegex) || user.name.match(searchRegex)) &&
      user._id !== currentUserId &&
      user.isActive
  );

  res.json({
    success: true,
    data: { users },
  });
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Search test server is working!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Search test server running on port ${PORT}`);
  console.log(
    "Test the search with: curl 'http://localhost:5000/api/users/search?q=john' -H 'Authorization: Bearer test'"
  );
});
