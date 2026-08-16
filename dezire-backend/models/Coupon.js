const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    type:          { type: String, enum: ['percent', 'flat'], required: true },
    value:         { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount:   { type: Number },
    expiresAt:     { type: Date },
    usageLimit:    { type: Number },
    usedCount:     { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
