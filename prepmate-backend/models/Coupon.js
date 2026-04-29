const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "scheduled", "expired"],
      default: "active",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_access"],
      default: "percentage",
    },
    value: { type: Number, default: 0 },
    maxDiscountCap: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 0 },
    oneTimeUse: { type: Boolean, default: false },
    usedCount: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    scheduledActivation: { type: Date },
    eligibility: { type: Object, default: {} },
    restrictions: { type: Object, default: {} },
    variant: { type: String, default: "standard" },
    referralUserId: { type: String, default: null },
    tier: { type: String, default: "general" },
    prefix: { type: String, default: "" },
    tags: { type: [String], default: [] },
    createdBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", CouponSchema);
