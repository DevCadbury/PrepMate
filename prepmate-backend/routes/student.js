const express = require("express");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Apply authentication and authorization middleware to all student routes
router.use(authenticateToken);
router.use(authorizeRoles(["student"]));

// @route   GET /api/student/dashboard
// @desc    Get student dashboard data
// @access  Student only
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;

      // Get user stats
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Mock data for roadmaps (in real app, this would come from Roadmap model)
      const roadmaps = [
        {
          id: "1",
          title: "Data Structures & Algorithms",
          category: "Computer Science",
          progress: 75,
          totalTopics: 20,
          completedTopics: 15,
        },
        {
          id: "2",
          title: "System Design",
          category: "Software Engineering",
          progress: 45,
          totalTopics: 15,
          completedTopics: 7,
        },
        {
          id: "3",
          title: "Web Development",
          category: "Frontend",
          progress: 90,
          totalTopics: 12,
          completedTopics: 11,
        },
      ];

      // Mock data for mock interviews (in real app, this would come from Interview model)
      const mockInterviews = [
        {
          id: "1",
          type: "HR Interview",
          score: 85,
          date: "2024-01-15T10:30:00Z",
          feedback:
            "Excellent communication skills and confidence. Good answers to behavioral questions.",
        },
        {
          id: "2",
          type: "Technical Interview",
          score: 72,
          date: "2024-01-10T14:00:00Z",
          feedback:
            "Good problem-solving approach but needs improvement in time management.",
        },
        {
          id: "3",
          type: "System Design",
          score: 68,
          date: "2024-01-05T16:30:00Z",
          feedback:
            "Basic understanding of system design concepts. Need more practice with scalability.",
        },
      ];

      // Calculate stats from user data
      const stats = {
        questionsSolved: user.stats?.questionsSolved || 0,
        averageScore: user.stats?.averageScore || 0,
        streakDays: user.stats?.streakDays || 0,
        totalTime: user.stats?.totalTime || 0,
      };

      res.json({
        success: true,
        data: {
          roadmaps,
          mockInterviews,
          stats,
        },
      });
    } catch (error) {
      logger.error("Student dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
      });
    }
  })
);

// @route   GET /api/student/roadmaps
// @desc    Get student's roadmap progress
// @access  Student only
router.get(
  "/roadmaps",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Mock roadmap data (in real app, this would come from Roadmap model)
    const roadmaps = [
      {
        id: "1",
        title: "Data Structures & Algorithms",
        category: "Computer Science",
        progress: 75,
        totalTopics: 20,
        completedTopics: 15,
        topics: [
          { id: "1", title: "Arrays", completed: true, score: 90 },
          { id: "2", title: "Linked Lists", completed: true, score: 85 },
          { id: "3", title: "Stacks & Queues", completed: true, score: 88 },
          { id: "4", title: "Trees", completed: true, score: 82 },
          { id: "5", title: "Graphs", completed: false, score: 0 },
          { id: "6", title: "Dynamic Programming", completed: false, score: 0 },
        ],
      },
      {
        id: "2",
        title: "System Design",
        category: "Software Engineering",
        progress: 45,
        totalTopics: 15,
        completedTopics: 7,
        topics: [
          { id: "1", title: "Load Balancing", completed: true, score: 78 },
          { id: "2", title: "Caching", completed: true, score: 85 },
          { id: "3", title: "Database Design", completed: true, score: 72 },
          { id: "4", title: "Microservices", completed: false, score: 0 },
          { id: "5", title: "Scalability", completed: false, score: 0 },
        ],
      },
    ];

    res.json({
      success: true,
      data: { roadmaps },
    });
  })
);

// @route   GET /api/student/mock-interviews
// @desc    Get student's mock interview history
// @access  Student only
router.get(
  "/mock-interviews",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Mock interview data (in real app, this would come from Interview model)
    const interviews = [
      {
        id: "1",
        type: "HR Interview",
        score: 85,
        date: "2024-01-15T10:30:00Z",
        duration: 45,
        feedback:
          "Excellent communication skills and confidence. Good answers to behavioral questions.",
        questions: [
          "Tell me about yourself",
          "Why do you want to work here?",
          "Describe a challenging situation you faced",
        ],
        answers: [
          "I'm a passionate software engineer with 3 years of experience...",
          "I'm excited about the company's mission and innovative projects...",
          "I once had to debug a critical production issue under pressure...",
        ],
      },
      {
        id: "2",
        type: "Technical Interview",
        score: 72,
        date: "2024-01-10T14:00:00Z",
        duration: 60,
        feedback:
          "Good problem-solving approach but needs improvement in time management.",
        questions: [
          "Implement a function to find the longest palindrome substring",
          "Explain the time complexity of your solution",
        ],
        answers: [
          "I would use dynamic programming approach...",
          "The time complexity is O(n²) and space complexity is O(n²)...",
        ],
      },
    ];

    res.json({
      success: true,
      data: { interviews },
    });
  })
);

// @route   GET /api/student/practice-stats
// @desc    Get student's coding practice statistics
// @access  Student only
router.get(
  "/practice-stats",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Mock practice stats (in real app, this would come from Practice model)
    const stats = {
      totalQuestions: 150,
      solvedQuestions: 89,
      averageScore: 78,
      streakDays: 12,
      totalTime: 3600, // in minutes
      difficultyBreakdown: {
        easy: { solved: 45, total: 50 },
        medium: { solved: 35, total: 70 },
        hard: { solved: 9, total: 30 },
      },
      topicBreakdown: {
        Arrays: { solved: 15, total: 20 },
        Strings: { solved: 12, total: 18 },
        "Linked Lists": { solved: 8, total: 12 },
        Trees: { solved: 10, total: 15 },
        "Dynamic Programming": { solved: 5, total: 10 },
      },
      recentActivity: [
        { date: "2024-01-15", questions: 3, score: 85 },
        { date: "2024-01-14", questions: 2, score: 90 },
        { date: "2024-01-13", questions: 4, score: 75 },
        { date: "2024-01-12", questions: 1, score: 100 },
        { date: "2024-01-11", questions: 2, score: 80 },
      ],
    };

    res.json({
      success: true,
      data: { stats },
    });
  })
);

// @route   POST /api/student/update-progress
// @desc    Update student's learning progress
// @access  Student only
router.post(
  "/update-progress",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { roadmapId, topicId, score, timeSpent } = req.body;

    // Update user stats
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update stats (in real app, this would update Roadmap and Topic models)
    if (user.stats) {
      user.stats.questionsSolved += 1;
      user.stats.averageScore = Math.round(
        (user.stats.averageScore + score) / 2
      );
      user.stats.totalTime += timeSpent || 0;
    }

    await user.save();

    logger.info(
      `Student ${userId} updated progress for roadmap ${roadmapId}, topic ${topicId}`
    );

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: { stats: user.stats },
    });
  })
);

// @route   GET /api/student/achievements
// @desc    Get student's achievements and badges
// @access  Student only
router.get(
  "/achievements",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Mock achievements data (in real app, this would come from Achievement model)
    const achievements = [
      {
        id: "1",
        title: "First Steps",
        description: "Complete your first coding problem",
        icon: "🎯",
        unlocked: true,
        unlockedAt: "2024-01-01T10:00:00Z",
      },
      {
        id: "2",
        title: "Streak Master",
        description: "Maintain a 7-day practice streak",
        icon: "🔥",
        unlocked: true,
        unlockedAt: "2024-01-08T15:30:00Z",
      },
      {
        id: "3",
        title: "Problem Solver",
        description: "Solve 50 coding problems",
        icon: "💻",
        unlocked: false,
        progress: 35,
        target: 50,
      },
      {
        id: "4",
        title: "Interview Ready",
        description: "Complete 5 mock interviews",
        icon: "🎤",
        unlocked: false,
        progress: 2,
        target: 5,
      },
    ];

    res.json({
      success: true,
      data: { achievements },
    });
  })
);

module.exports = router;
