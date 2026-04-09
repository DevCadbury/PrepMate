const mongoose = require("mongoose");

const codingTestCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Problem title is required"],
      trim: true,
      maxlength: [160, "Title cannot exceed 160 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Problem description is required"],
    },
    inputFormat: {
      type: String,
      default: "",
    },
    outputFormat: {
      type: String,
      default: "",
    },
    constraints: {
      type: [String],
      default: [],
    },
    sampleTestCases: {
      type: [codingTestCaseSchema],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one sample test case is required",
      },
    },
    publicTestCases: {
      type: [codingTestCaseSchema],
      default: [],
    },
    hiddenTestCases: {
      type: [codingTestCaseSchema],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one hidden test case is required",
      },
    },
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    editorial: {
      content: {
        type: String,
        default: "",
      },
      codeExamples: {
        type: Map,
        of: String,
        default: {},
      },
    },
    acceptance: {
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      totalAccepted: {
        type: Number,
        default: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    approvalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Approval notes cannot exceed 2000 characters"],
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

codingProblemSchema.virtual("acceptanceRate").get(function () {
  const total = Number(this.acceptance?.totalSubmissions || 0);
  const accepted = Number(this.acceptance?.totalAccepted || 0);

  if (total <= 0) {
    return 0;
  }

  return Number(((accepted / total) * 100).toFixed(2));
});

module.exports = mongoose.model("CodingProblem", codingProblemSchema);
