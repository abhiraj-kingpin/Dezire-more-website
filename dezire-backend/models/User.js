const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label:     { type: String, default: 'Home', trim: true },
    line1:     { type: String, required: true, trim: true },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pin:       { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const membershipPaymentSchema = new mongoose.Schema(
  {
    tier:   { type: String, enum: ['gold', 'platinum'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, trim: true, default: '' },
    phone:        { type: String, trim: true, default: '' },

    // Gated behind OTP verification at signup — unverified accounts can't log in.
    emailVerified: { type: Boolean, default: false },

    addresses: [addressSchema],

    notificationsEnabled: { type: Boolean, default: true },

    membership: {
      tier:        { type: String, enum: ['none', 'gold', 'platinum'], default: 'none' },
      status:      { type: String, enum: ['inactive', 'pending', 'active', 'expired'], default: 'inactive' },
      startDate:   { type: Date },
      renewalDate: { type: Date },
      payments:    [membershipPaymentSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
