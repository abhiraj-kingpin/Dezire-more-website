const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash:  { type: String, required: true },
    purpose:   { type: String, enum: ['signup', 'login'], required: true },
    attempts:  { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo TTL index — documents are automatically removed once expiresAt passes,
// so stale/expired codes never pile up.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
