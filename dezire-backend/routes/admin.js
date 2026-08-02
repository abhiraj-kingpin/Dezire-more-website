const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { adminLoginLimiter } = require('../middleware/rateLimiter');
const adminAuth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// POST /api/admin/login
// Body: { email, password }
router.post('/login', adminLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check against env vars (for now — Point 5 adds a proper User model).
  // Normalized the same way customer login treats its email (auth.js), so
  // an admin typing a different case than what's in .env isn't rejected.
  const normalizedEmail = email.toLowerCase().trim();
  const validEmail    = normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const validPassword = password === process.env.ADMIN_PASSWORD;

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
    admin: { email },
  });
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
