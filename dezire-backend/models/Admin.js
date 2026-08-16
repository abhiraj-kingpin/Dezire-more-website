const mongoose = require('mongoose');

// The site's admin credentials, moved out of static env vars (ADMIN_EMAIL/
// ADMIN_PASSWORD) so they can actually be changed from the admin panel.
// On Render, env vars can only be edited from Render's own dashboard — the
// app itself has no way to persist a change to them — so "change password"
// has to mean a database row, not a rewritten .env. routes/admin.js seeds
// this collection from ADMIN_EMAIL/ADMIN_PASSWORD the first time anyone logs
// in if it's still empty, so an existing deployment keeps working with zero
// migration step; from then on this collection is the source of truth and
// the env vars are only a fallback if the DB is ever empty again.
const adminSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
