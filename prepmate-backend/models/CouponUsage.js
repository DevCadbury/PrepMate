const mongoose = require("mongoose");

const CouponUsageSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    couponCode: { type: String, default: "" },
    userId: { type: String, default: "" },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userRole: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    discountApplied: { type: Number, default: 0 },
    context: { type: String, default: "" },
    orderId: { type: String, default: "" },
    suspicious: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },
    device: { type: String, default: "" },
    country: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponUsage", CouponUsageSchema);
