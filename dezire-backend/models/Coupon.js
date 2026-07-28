const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    type:          { type: String, enum: ['percent', 'flat'], required: true },
    value:         { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount:   { type: Number }, // caps a percent coupon's rupee value; ignored for flat coupons
    expiresAt:     { type: Date },
    usageLimit:    { type: Number }, // total redemptions across all customers; unlimited if unset
    usedCount:     { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
