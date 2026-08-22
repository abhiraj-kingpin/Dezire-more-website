const AuditLog = require('../models/AuditLog');

function logAdminAction(adminEmail, action, targetId, details) {
  AuditLog.create({ adminEmail, action, targetId, details }).catch(err => {
    console.error('[audit log]', err.message);
  });
}

module.exports = { logAdminAction };
