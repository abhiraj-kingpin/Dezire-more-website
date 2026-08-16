const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { adminLoginLimiter, authLimiter } = require('../middleware/rateLimiter');
const adminAuth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const VerificationToken = require('../models/VerificationToken');
const { sendAdminResetEmail } = require('../utils/notifications');
const { logAdminAction } = require('../utils/auditLog');

const RESET_TTL_HOURS = 1;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// The admin account now lives in MongoDB (see models/Admin.js) so it can
// actually be changed — but the very first login on a given deployment
// needs *something* to check against, and requiring a separate migration
// step before anyone can log in at all would be a bad first-run experience.
// So: if the Admin collection is still empty, seed it once from the legacy
// ADMIN_EMAIL/ADMIN_PASSWORD env vars. Every login after that reads the DB.
async function getOrSeedAdmin() {
  let admin = await Admin.findOne();
  if (admin) return admin;

  const seedEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const seedPassword = process.env.ADMIN_PASSWORD;
  if (!seedEmail || !seedPassword) return null;

  const passwordHash = await bcrypt.hash(seedPassword, 10);
  admin = await Admin.create({ email: seedEmail, passwordHash });
  return admin;
}

// POST /api/admin/login
// Body: { email, password }
router.post('/login', adminLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const admin = await getOrSeedAdmin();
    const validEmail = !!admin && admin.email === normalizedEmail;
    const validPassword = validEmail && await bcrypt.compare(password, admin.passwordHash);

    if (!validEmail || !validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue a JWT valid for 7 days
    const token = jwt.sign(
      { email: normalizedEmail, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: { email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/credentials — change the admin email and/or password.
// Requires the current password, same as any account-settings "change
// password" form, so a stolen still-valid JWT alone isn't enough to lock
// the real admin out.
router.patch('/credentials', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
    if (!newEmail && !newPassword) return res.status(400).json({ error: 'Provide a new email and/or new password' });

    const admin = await Admin.findOne({ email: req.admin.email });
    if (!admin) return res.status(404).json({ error: 'Admin account not found' });

    const validPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!validPassword) return res.status(401).json({ error: 'Current password is incorrect' });

    if (newEmail) admin.email = newEmail.toLowerCase().trim();
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      admin.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await admin.save();

    logAdminAction(req.admin.email, 'admin.credentials-change', null, newEmail ? `email changed to ${admin.email}` : 'password changed');

    // Re-issue a token under the (possibly new) email so the current
    // session doesn't get logged out by its own change.
    const token = jwt.sign({ email: admin.email, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, admin: { email: admin.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'That email is already in use' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/forgot-password — emails a reset link to the registered
// admin email. Always responds the same way whether or not that email
// matches, so this can't be used to probe for the admin's address.
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.toLowerCase().trim();

    const admin = await getOrSeedAdmin();
    if (admin && admin.email === normalizedEmail) {
      const token = crypto.randomBytes(32).toString('hex');
      await VerificationToken.deleteMany({ email: normalizedEmail, purpose: 'admin-reset' });
      await VerificationToken.create({
        email: normalizedEmail,
        tokenHash: hashToken(token),
        purpose: 'admin-reset',
        expiresAt: new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000),
      });
      // admin-panel.html is served directly off this same Express app (see
      // app.use(express.static(__dirname)) in app.js) — NOT off FRONTEND_URL,
      // which is the separate Vercel-hosted storefront. Building the link
      // from the actual incoming request (trust-proxy is already on, so this
      // reflects the real public host behind Render) keeps this correct in
      // local dev and production without a hardcoded/extra env var.
      const resetUrl = `${req.protocol}://${req.get('host')}/admin-panel.html?reset-token=${token}`;
      sendAdminResetEmail(normalizedEmail, resetUrl).catch(err =>
        console.error('[admin] Failed to send reset email:', err.message)
      );
    }

    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reset-password — completes the flow above: exchanges a
// valid, unexpired reset token for a new password. No current-password
// check here, unlike /credentials — the emailed link IS the proof of
// access to the registered inbox.
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const record = await VerificationToken.findOne({ tokenHash: hashToken(token), purpose: 'admin-reset' });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    const admin = await Admin.findOne({ email: record.email });
    if (!admin) return res.status(404).json({ error: 'Admin account not found' });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();
    await VerificationToken.deleteOne({ _id: record._id });

    logAdminAction(admin.email, 'admin.password-reset', null, 'password reset via emailed link');
    res.json({ success: true, message: 'Password has been reset — you can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/verify — check if token is still valid
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, admin: { email: decoded.email } });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// GET /api/admin/audit-log — recent admin actions (order/product/coupon/
// membership changes), newest first.
router.get('/audit-log', adminAuth, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/audit-log/month/:month — bulk-clear a whole month's
// worth of entries at once (month as 'YYYY-MM', e.g. '2026-08') so the log
// doesn't grow forever. A specific /month/ path rather than a query string
// so it can't accidentally collide with the single-entry DELETE below.
router.delete('/audit-log/month/:month', adminAuth, async (req, res) => {
  try {
    const match = /^(\d{4})-(\d{2})$/.exec(req.params.month);
    if (!match) return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
    const [, year, month] = match;
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);

    const result = await AuditLog.deleteMany({ createdAt: { $gte: start, $lt: end } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/audit-log/:id — remove a single entry.
router.delete('/audit-log/:id', adminAuth, async (req, res) => {
  try {
    const result = await AuditLog.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Log entry not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
