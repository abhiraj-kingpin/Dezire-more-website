const mongoose = require('mongoose');

// There's a single shared admin login (see models/Admin.js — one admin
// account, no per-admin User accounts), so this can only attribute actions
// to "the admin who was logged in," not a specific person — still useful
// for "what changed and when" even without per-person accountability.
const auditLogSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, required: true },
    action:     { type: String, required: true }, // e.g. 'order.status', 'product.update'
    targetId:   { type: mongoose.Schema.Types.ObjectId },
    details:    { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
