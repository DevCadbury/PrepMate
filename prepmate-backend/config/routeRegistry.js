const authRoutes = require("../routes/auth");
const adminRoutes = require("../routes/admin");
const studentRoutes = require("../routes/student");
const teacherRoutes = require("../routes/teacher");
const socialRoutes = require("../routes/social");
const profileRoutes = require("../routes/profile");
const usersRoutes = require("../routes/users");
const notificationsRoutes = require("../routes/notifications");
const commentsRoutes = require("../routes/comments");
const chatRoutes = require("../routes/chat");
const supportRoutes = require("../routes/support");
const aiRoutes = require("../routes/ai");
const codingRoutes = require("../routes/coding");
const uploadsRoutes = require("../routes/uploads");
const healthRoutes = require("../routes/health");

const apiRoutes = [
  { path: "/api/auth", router: authRoutes },
  { path: "/api/admin", router: adminRoutes },
  { path: "/api/student", router: studentRoutes },
  { path: "/api/teacher", router: teacherRoutes },
  { path: "/api/social", router: socialRoutes },
  { path: "/api/profile", router: profileRoutes },
  { path: "/api/users", router: usersRoutes },
  { path: "/api/notifications", router: notificationsRoutes },
  { path: "/api/social/notifications", router: notificationsRoutes },
  { path: "/api/comments", router: commentsRoutes },
  { path: "/api/chat", router: chatRoutes },
  { path: "/api/support", router: supportRoutes },
  { path: "/api/ai", router: aiRoutes },
  { path: "/api/coding", router: codingRoutes },
  { path: "/api/uploads", router: uploadsRoutes },
];

const healthRoutePaths = ["/health", "/api/health"];

module.exports = {
  apiRoutes,
  healthRoutes,
  healthRoutePaths,
};
