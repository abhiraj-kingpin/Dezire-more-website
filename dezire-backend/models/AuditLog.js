const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, required: true },
    action:     { type: String, required: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId },
    details:    { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
