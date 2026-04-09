const mongoose = require("mongoose");

const codingSubmissionTestResultSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    actualOutput: {
      type: String,
      default: "",
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Unknown",
    },
    isHidden: {
      type: Boolean,
      default: true,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
    memoryKb: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const codingSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingProblem",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["run", "submit"],
      default: "submit",
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Internal Error",
      ],
      index: true,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
    memoryKb: {
      type: Number,
      default: 0,
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    testResults: {
      type: [codingSubmissionTestResultSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

codingSubmissionSchema.index({ user: 1, createdAt: -1 });
codingSubmissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

module.exports = mongoose.model("CodingSubmission", codingSubmissionSchema);
