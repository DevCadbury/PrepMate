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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  process.exit(0); // Exit after successful start
});

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
