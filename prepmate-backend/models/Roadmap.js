const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
    default: "beginner",
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 60,
  },
  resources: [
    {
      type: {
        type: String,
        enum: ["video", "article", "practice", "quiz", "project"],
        required: true,
      },
      title: String,
      url: String,
      description: String,
      duration: Number, // in minutes
    },
  ],
  practiceQuestions: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CodingQuestion",
      },
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy",
      },
    },
  ],
  prerequisites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
    },
  ],
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completionDate: Date,
  userProgress: {
    timeSpent: { type: Number, default: 0 }, // in minutes
    resourcesCompleted: { type: Number, default: 0 },
    questionsSolved: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // percentage
  },
});

const roadmapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a roadmap title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a roadmap description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Please provide a category"],
      enum: [
        "dsa",
        "system-design",
        "web-development",
        "mobile-development",
        "data-science",
        "devops",
        "cybersecurity",
        "ai-ml",
      ],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },
    estimatedDuration: {
      type: Number, // in hours
      required: true,
    },
    topics: [topicSchema],
    prerequisites: [String],
    learningOutcomes: [String],
    thumbnail: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    stats: {
      totalEnrollments: { type: Number, default: 0 },
      averageCompletionTime: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for progress calculation
roadmapSchema.virtual("totalTopics").get(function () {
  return this.topics.length;
});

roadmapSchema.virtual("completedTopics").get(function () {
  return this.topics.filter((topic) => topic.isCompleted).length;
});

roadmapSchema.virtual("progressPercentage").get(function () {
  if (this.totalTopics === 0) return 0;
  return Math.round((this.completedTopics / this.totalTopics) * 100);
});

// Indexes for better query performance
roadmapSchema.index({ category: 1, difficulty: 1 });
roadmapSchema.index({ isPublished: 1, isPremium: 1 });
roadmapSchema.index({ createdBy: 1 });
roadmapSchema.index({ tags: 1 });

// Instance method to calculate user progress
roadmapSchema.methods.calculateUserProgress = function (userId) {
  const userProgress = {
    totalTopics: this.topics.length,
    completedTopics: 0,
    totalTimeSpent: 0,
    totalScore: 0,
    progressPercentage: 0,
  };

  this.topics.forEach((topic) => {
    if (topic.isCompleted) {
      userProgress.completedTopics++;
    }
    userProgress.totalTimeSpent += topic.userProgress.timeSpent || 0;
    userProgress.totalScore += topic.userProgress.score || 0;
  });

  if (userProgress.totalTopics > 0) {
    userProgress.progressPercentage = Math.round(
      (userProgress.completedTopics / userProgress.totalTopics) * 100
    );
    userProgress.averageScore = Math.round(
      userProgress.totalScore / userProgress.totalTopics
    );
  }

  return userProgress;
};

// Static method to get roadmaps by category
roadmapSchema.statics.getByCategory = function (category, options = {}) {
  const query = { category, isPublished: true };

  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }

  if (options.isPremium !== undefined) {
    query.isPremium = options.isPremium;
  }

  return this.find(query)
    .populate("createdBy", "name avatar")
    .sort({ createdAt: -1 });
};

// Static method to search roadmaps
roadmapSchema.statics.search = function (searchTerm, options = {}) {
  const query = {
    isPublished: true,
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
      { tags: { $in: [new RegExp(searchTerm, "i")] } },
    ],
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.difficulty) {
    query.difficulty = options.difficulty;
  }

  return this.find(query)
    .populate("createdBy", "name avatar")
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Roadmap", roadmapSchema);
