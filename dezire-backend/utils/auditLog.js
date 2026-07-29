const AuditLog = require('../models/AuditLog');

// Fire-and-forget by design — a logging failure should never block the
// actual admin action it's recording.
function logAdminAction(adminEmail, action, targetId, details) {
  AuditLog.create({ adminEmail, action, targetId, details }).catch(err => {
    console.error('[audit log]', err.message);
  });
}

module.exports = { logAdminAction };
