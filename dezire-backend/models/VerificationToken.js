const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose:   { type: String, enum: ['signup', 'admin-reset'], default: 'signup' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
