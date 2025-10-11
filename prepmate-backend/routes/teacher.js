const express = require("express");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Apply authentication and authorization middleware to all teacher routes
router.use(authenticateToken);
router.use(authorizeRoles(["teacher", "hr"]));

// @route   GET /api/teacher/dashboard
// @desc    Get teacher dashboard data
// @access  Teacher/HR only
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    try {
      const teacherId = req.user.id;

      // Mock data for tests (in real app, this would come from Test model)
      const tests = [
        {
          id: "1",
          title: "JavaScript Fundamentals",
          type: "Coding",
          assignedTo: 25,
          completedBy: 18,
          deadline: "2024-01-20T23:59:59Z",
          status: "active",
        },
        {
          id: "2",
          title: "System Design Interview",
          type: "Mixed",
          assignedTo: 15,
          completedBy: 12,
          deadline: "2024-01-25T23:59:59Z",
          status: "active",
        },
        {
          id: "3",
          title: "HR Behavioral Questions",
          type: "MCQ",
          assignedTo: 30,
          completedBy: 30,
          deadline: "2024-01-15T23:59:59Z",
          status: "completed",
        },
        {
          id: "4",
          title: "Data Structures Assessment",
          type: "Coding",
          assignedTo: 20,
          completedBy: 0,
          deadline: "2024-02-01T23:59:59Z",
          status: "draft",
        },
      ];

      // Mock data for students (in real app, this would come from Student model)
      const students = [
        {
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
          testsCompleted: 8,
          averageScore: 85,
          lastActivity: "2024-01-15T14:30:00Z",
          status: "active",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          testsCompleted: 6,
          averageScore: 92,
          lastActivity: "2024-01-14T16:45:00Z",
          status: "active",
        },
        {
          id: "3",
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          testsCompleted: 4,
          averageScore: 78,
          lastActivity: "2024-01-10T09:15:00Z",
          status: "inactive",
        },
      ];

      // Mock data for submissions (in real app, this would come from Submission model)
      const submissions = [
        {
          id: "1",
          studentName: "John Doe",
          testTitle: "JavaScript Fundamentals",
          submittedAt: "2024-01-15T14:30:00Z",
          score: 85,
          status: "graded",
        },
        {
          id: "2",
          studentName: "Jane Smith",
          testTitle: "System Design Interview",
          submittedAt: "2024-01-16T10:20:00Z",
          status: "pending",
        },
        {
          id: "3",
          studentName: "Mike Johnson",
          testTitle: "JavaScript Fundamentals",
          submittedAt: "2024-01-17T23:45:00Z",
          status: "late",
        },
      ];

      res.json({
        success: true,
        data: {
          tests,
          students,
          submissions,
        },
      });
    } catch (error) {
      logger.error("Teacher dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
      });
    }
  })
);

// @route   POST /api/teacher/tests
// @desc    Create a new test
// @access  Teacher/HR only
router.post(
  "/tests",
  asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { title, type, questions, assignedStudents, deadline, instructions } =
      req.body;

    // Validate required fields
    if (!title || !type || !questions || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Mock test creation (in real app, this would save to Test model)
    const newTest = {
      id: Date.now().toString(),
      title,
      type,
      questions,
      assignedStudents: assignedStudents || [],
      deadline,
      instructions,
      createdBy: teacherId,
      createdAt: new Date(),
      status: "draft",
    };

    logger.info(`Teacher ${teacherId} created test: ${title}`);

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: { test: newTest },
    });
  })
);

// @route   GET /api/teacher/tests
// @desc    Get all tests created by teacher
// @access  Teacher/HR only
router.get(
  "/tests",
  asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { status, type } = req.query;

    // Mock tests data (in real app, this would query Test model)
    let tests = [
      {
        id: "1",
        title: "JavaScript Fundamentals",
        type: "Coding",
        assignedTo: 25,
        completedBy: 18,
        deadline: "2024-01-20T23:59:59Z",
        status: "active",
        createdAt: "2024-01-10T10:00:00Z",
      },
      {
        id: "2",
        title: "System Design Interview",
        type: "Mixed",
        assignedTo: 15,
        completedBy: 12,
        deadline: "2024-01-25T23:59:59Z",
        status: "active",
        createdAt: "2024-01-12T14:30:00Z",
      },
      {
        id: "3",
        title: "HR Behavioral Questions",
        type: "MCQ",
        assignedTo: 30,
        completedBy: 30,
        deadline: "2024-01-15T23:59:59Z",
        status: "completed",
        createdAt: "2024-01-05T09:15:00Z",
      },
    ];

    // Apply filters
    if (status) {
      tests = tests.filter((test) => test.status === status);
    }
    if (type) {
      tests = tests.filter((test) => test.type === type);
    }

    res.json({
      success: true,
      data: { tests },
    });
  })
);

// @route   GET /api/teacher/tests/:testId
// @desc    Get specific test details
// @access  Teacher/HR only
router.get(
  "/tests/:testId",
  asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const teacherId = req.user.id;

    // Mock test details (in real app, this would query Test model)
    const test = {
      id: testId,
      title: "JavaScript Fundamentals",
      type: "Coding",
      questions: [
        {
          id: "1",
          type: "coding",
          title: "Implement a function to reverse a string",
          description:
            "Write a function that takes a string and returns the reversed version",
          points: 10,
          testCases: [
            { input: "hello", output: "olleh" },
            { input: "world", output: "dlrow" },
          ],
        },
        {
          id: "2",
          type: "mcq",
          title: "What is the time complexity of Array.push()?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
          correctAnswer: 0,
          points: 5,
        },
      ],
      assignedStudents: ["student1", "student2", "student3"],
      deadline: "2024-01-20T23:59:59Z",
      instructions:
        "Complete all questions within the time limit. Show your work for coding questions.",
      status: "active",
      submissions: [
        {
          studentId: "student1",
          studentName: "John Doe",
          submittedAt: "2024-01-15T14:30:00Z",
          score: 85,
          status: "graded",
        },
      ],
    };

    res.json({
      success: true,
      data: { test },
    });
  })
);

// @route   PUT /api/teacher/tests/:testId
// @desc    Update test details
// @access  Teacher/HR only
router.put(
  "/tests/:testId",
  asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const teacherId = req.user.id;
    const updates = req.body;

    // Mock test update (in real app, this would update Test model)
    logger.info(`Teacher ${teacherId} updated test ${testId}`);

    res.json({
      success: true,
      message: "Test updated successfully",
    });
  })
);

// @route   DELETE /api/teacher/tests/:testId
// @desc    Delete a test
// @access  Teacher/HR only
router.delete(
  "/tests/:testId",
  asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const teacherId = req.user.id;

    // Mock test deletion (in real app, this would delete from Test model)
    logger.info(`Teacher ${teacherId} deleted test ${testId}`);

    res.json({
      success: true,
      message: "Test deleted successfully",
    });
  })
);

// @route   GET /api/teacher/students
// @desc    Get all students assigned to teacher
// @access  Teacher/HR only
router.get(
  "/students",
  asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { status, search } = req.query;

    // Mock students data (in real app, this would query Student model)
    let students = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        testsCompleted: 8,
        averageScore: 85,
        lastActivity: "2024-01-15T14:30:00Z",
        status: "active",
        assignedTests: ["test1", "test2"],
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        testsCompleted: 6,
        averageScore: 92,
        lastActivity: "2024-01-14T16:45:00Z",
        status: "active",
        assignedTests: ["test1", "test3"],
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        testsCompleted: 4,
        averageScore: 78,
        lastActivity: "2024-01-10T09:15:00Z",
        status: "inactive",
        assignedTests: ["test1"],
      },
    ];

    // Apply filters
    if (status) {
      students = students.filter((student) => student.status === status);
    }
    if (search) {
      students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: { students },
    });
  })
);

// @route   GET /api/teacher/submissions
// @desc    Get all submissions for teacher's tests
// @access  Teacher/HR only
router.get(
  "/submissions",
  asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { testId, status } = req.query;

    // Mock submissions data (in real app, this would query Submission model)
    let submissions = [
      {
        id: "1",
        studentName: "John Doe",
        studentId: "student1",
        testTitle: "JavaScript Fundamentals",
        testId: "test1",
        submittedAt: "2024-01-15T14:30:00Z",
        score: 85,
        status: "graded",
        answers: [
          {
            questionId: "1",
            answer:
              "function reverseString(str) { return str.split('').reverse().join(''); }",
            score: 8,
          },
          {
            questionId: "2",
            answer: "O(1)",
            score: 5,
          },
        ],
      },
      {
        id: "2",
        studentName: "Jane Smith",
        studentId: "student2",
        testTitle: "System Design Interview",
        testId: "test2",
        submittedAt: "2024-01-16T10:20:00Z",
        status: "pending",
        answers: [],
      },
    ];

    // Apply filters
    if (testId) {
      submissions = submissions.filter(
        (submission) => submission.testId === testId
      );
    }
    if (status) {
      submissions = submissions.filter(
        (submission) => submission.status === status
      );
    }

    res.json({
      success: true,
      data: { submissions },
    });
  })
);

// @route   PUT /api/teacher/submissions/:submissionId/grade
// @desc    Grade a submission
// @access  Teacher/HR only
router.put(
  "/submissions/:submissionId/grade",
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const teacherId = req.user.id;
    const { scores, feedback, totalScore } = req.body;

    // Mock grading (in real app, this would update Submission model)
    logger.info(`Teacher ${teacherId} graded submission ${submissionId}`);

    res.json({
      success: true,
      message: "Submission graded successfully",
      data: {
        submissionId,
        totalScore,
        feedback,
      },
    });
  })
);

// @route   GET /api/teacher/analytics
// @desc    Get teacher analytics
// @access  Teacher/HR only
router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { period = "month" } = req.query;

    // Mock analytics data (in real app, this would calculate from various models)
    const analytics = {
      period,
      totalTests: 12,
      activeTests: 3,
      totalStudents: 45,
      averageCompletionRate: 78,
      averageScore: 82,
      testPerformance: [
        {
          testId: "1",
          title: "JavaScript Fundamentals",
          completionRate: 85,
          averageScore: 78,
        },
        {
          testId: "2",
          title: "System Design Interview",
          completionRate: 72,
          averageScore: 85,
        },
        {
          testId: "3",
          title: "HR Behavioral Questions",
          completionRate: 95,
          averageScore: 88,
        },
      ],
      studentProgress: [
        {
          studentId: "1",
          name: "John Doe",
          testsCompleted: 8,
          averageScore: 85,
        },
        {
          studentId: "2",
          name: "Jane Smith",
          testsCompleted: 6,
          averageScore: 92,
        },
        {
          studentId: "3",
          name: "Mike Johnson",
          testsCompleted: 4,
          averageScore: 78,
        },
      ],
    };

    res.json({
      success: true,
      data: analytics,
    });
  })
);

module.exports = router;
