const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Test comments route
app.get("/api/comments/test", (req, res) => {
  res.json({ message: "Comments route is working!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
