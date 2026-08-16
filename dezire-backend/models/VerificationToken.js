const mongoose = require('mongoose');

// Link-based email verification. The raw token only ever exists in the
// emailed link — we store a SHA-256 hash of it (fast, deterministic, and
// directly queryable, unlike bcrypt) so a database leak alone can't be used
// to verify/hijack an account.
const verificationTokenSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose:   { type: String, enum: ['signup', 'admin-reset'], default: 'signup' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo TTL index — expired tokens clean themselves up automatically.
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
