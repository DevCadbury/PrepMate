const mongoose = require("mongoose");

const supportTicketLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
      maxlength: [160, "Subject cannot exceed 160 characters"],
    },
    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
      maxlength: [6000, "Description cannot exceed 6000 characters"],
    },
    category: {
      type: String,
      enum: ["help", "bug", "billing", "abuse", "other"],
      default: "help",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [4000, "Admin notes cannot exceed 4000 characters"],
      default: "",
    },
    attachments: [
      {
        name: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
      },
    ],
    logs: {
      type: [supportTicketLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ status: 1, updatedAt: -1 });
supportTicketSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
