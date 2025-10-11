const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "technical",
      "behavioral",
      "situational",
      "problem-solving",
      "leadership",
    ],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  expectedAnswer: String,
  keywords: [String],
  followUpQuestions: [String],
  userAnswer: String,
  aiFeedback: {
    score: { type: Number, min: 0, max: 100 },
    feedback: String,
    suggestions: [String],
    confidence: { type: Number, min: 0, max: 100 },
    fluency: { type: Number, min: 0, max: 100 },
    technicalAccuracy: { type: Number, min: 0, max: 100 },
  },
  timeSpent: Number, // in seconds
  isAnswered: { type: Boolean, default: false },
});

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["technical", "behavioral", "mixed", "system-design", "coding"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    questions: [questionSchema],
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    startTime: Date,
    endTime: Date,
    totalDuration: Number, // actual duration in minutes
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiAnalysis: {
      overallFeedback: String,
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      confidence: { type: Number, min: 0, max: 100 },
      fluency: { type: Number, min: 0, max: 100 },
      technicalAccuracy: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      problemSolving: { type: Number, min: 0, max: 100 },
    },
    settings: {
      enableVoice: { type: Boolean, default: false },
      enableVideo: { type: Boolean, default: false },
      questionCount: { type: Number, default: 10 },
      timeLimit: { type: Number, default: 30 }, // minutes per question
      allowRetakes: { type: Boolean, default: true },
      showFeedback: { type: Boolean, default: true },
    },
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notes: String,
    recording: {
      audioUrl: String,
      videoUrl: String,
      transcript: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for interview duration
interviewSchema.virtual("durationInMinutes").get(function () {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return 0;
});

// Virtual for completion percentage
interviewSchema.virtual("completionPercentage").get(function () {
  if (this.questions.length === 0) return 0;
  const answeredQuestions = this.questions.filter((q) => q.isAnswered).length;
  return Math.round((answeredQuestions / this.questions.length) * 100);
});

// Virtual for average score
interviewSchema.virtual("averageScore").get(function () {
  const answeredQuestions = this.questions.filter(
    (q) => q.isAnswered && q.aiFeedback.score
  );
  if (answeredQuestions.length === 0) return 0;

  const totalScore = answeredQuestions.reduce(
    (sum, q) => sum + q.aiFeedback.score,
    0
  );
  return Math.round(totalScore / answeredQuestions.length);
});

// Indexes for better query performance
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ type: 1, difficulty: 1 });
interviewSchema.index({ "aiAnalysis.confidence": -1 });

// Instance method to start interview
interviewSchema.methods.startInterview = function () {
  this.status = "in-progress";
  this.startTime = new Date();
  return this.save();
};

// Instance method to end interview
interviewSchema.methods.endInterview = function () {
  this.status = "completed";
  this.endTime = new Date();
  this.totalDuration = this.durationInMinutes;

  // Calculate overall score
  const answeredQuestions = this.questions.filter(
    (q) => q.isAnswered && q.aiFeedback.score
  );
  if (answeredQuestions.length > 0) {
    const totalScore = answeredQuestions.reduce(
      (sum, q) => sum + q.aiFeedback.score,
      0
    );
    this.overallScore = Math.round(totalScore / answeredQuestions.length);
  }

  return this.save();
};

// Instance method to add question
interviewSchema.methods.addQuestion = function (questionData) {
  this.questions.push(questionData);
  return this.save();
};

// Instance method to answer question
interviewSchema.methods.answerQuestion = function (
  questionIndex,
  answer,
  aiFeedback
) {
  if (this.questions[questionIndex]) {
    this.questions[questionIndex].userAnswer = answer;
    this.questions[questionIndex].aiFeedback = aiFeedback;
    this.questions[questionIndex].isAnswered = true;
    this.questions[questionIndex].timeSpent = Date.now() - this.startTime;
  }
  return this.save();
};

// Static method to get user interviews
interviewSchema.statics.getUserInterviews = function (userId, options = {}) {
  const query = { user: userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("user", "name avatar");
};

// Static method to get interview statistics
interviewSchema.statics.getInterviewStats = function (userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: "completed" } },
    {
      $group: {
        _id: null,
        totalInterviews: { $sum: 1 },
        averageScore: { $avg: "$overallScore" },
        totalDuration: { $sum: "$totalDuration" },
        bestScore: { $max: "$overallScore" },
        recentScore: { $last: "$overallScore" },
      },
    },
  ]);
};

module.exports = mongoose.model("Interview", interviewSchema);
