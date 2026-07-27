const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// POST /api/admin/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check against env vars (for now — Point 5 adds a proper User model)
  const validEmail    = email    === process.env.ADMIN_EMAIL;
  const validPassword = password === process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Issue a JWT valid for 7 days
  const token = jwt.sign(
    { email, isAdmin: true },
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

module.exports = router;
