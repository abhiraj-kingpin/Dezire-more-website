const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const adminAuth = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/notifications');

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const MEMBERSHIP_PLANS = { gold: 5000, platinum: 10000 };

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function signToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    emailVerified: user.emailVerified,
    addresses: user.addresses,
    notificationsEnabled: user.notificationsEnabled,
    membership: user.membership,
    createdAt: user.createdAt,
  };
}

async function issueOtp(email, purpose) {
  const code = generateOtp();
  await Otp.deleteMany({ email, purpose });
  await Otp.create({
    email,
    codeHash: await bcrypt.hash(code, 10),
    purpose,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60000),
  });
  const result = await sendOtpEmail(email, code, purpose);
  // SMTP isn't configured yet — surface the code in the server log so signups
  // aren't a hard dead-end while that's being set up. Never exposed to the client.
  if (!result.sent) console.warn(`[auth] OTP for ${email} (${purpose}): ${code} — SMTP not configured, email not sent.`);
  return result;
}

// Customer session auth — separate from adminAuth (admin tokens carry isAdmin,
// customer tokens carry userId; neither satisfies the other's middleware).
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) return res.status(401).json({ error: 'Invalid session' });
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// POST /api/auth/signup/request-otp — creates/updates an unverified account
// and emails a 6-digit code. The account only becomes usable once verified.
router.post('/signup/request-otp', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.emailVerified) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.firstName = firstName;
      existing.lastName = lastName || '';
      existing.phone = phone || '';
      await existing.save();
    } else {
      await User.create({ email: normalizedEmail, passwordHash, firstName, lastName: lastName || '', phone: phone || '' });
    }

    const result = await issueOtp(normalizedEmail, 'signup');
    if (!result.sent) {
      return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again shortly.' });
    }

    res.json({ success: true, message: `A verification code was sent to ${normalizedEmail}`, resendCooldown: OTP_RESEND_COOLDOWN_SECONDS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/signup/verify-otp
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
    const normalizedEmail = email.toLowerCase().trim();

    const otp = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' }).sort({ createdAt: -1 });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    }
    if (otp.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }

    const match = await bcrypt.compare(code, otp.codeHash);
    if (!match) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'Account not found — please sign up again.' });

    user.emailVerified = true;
    await user.save();
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'signup' });

    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/signup/resend-otp
router.post('/signup/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.emailVerified) {
      return res.status(400).json({ error: 'No pending signup found for this email' });
    }

    const result = await issueOtp(normalizedEmail, 'signup');
    if (!result.sent) return res.status(503).json({ error: 'Email verification is temporarily unavailable.' });

    res.json({ success: true, resendCooldown: OTP_RESEND_COOLDOWN_SECONDS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        needsVerification: true,
        email: normalizedEmail,
      });
    }

    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — restore session on app load
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PATCH /api/auth/me — update profile fields
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, phone, notificationsEnabled } = req.body;
    if (firstName !== undefined) req.user.firstName = firstName;
    if (lastName !== undefined) req.user.lastName = lastName;
    if (phone !== undefined) req.user.phone = phone;
    if (notificationsEnabled !== undefined) req.user.notificationsEnabled = notificationsEnabled;
    await req.user.save();
    res.json({ success: true, user: publicUser(req.user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Saved addresses ─────────────────────────────────────────────────────────

router.post('/addresses', requireAuth, async (req, res) => {
  try {
    const { label, line1, city, state, pin, isDefault } = req.body;
    if (!line1 || !city || !state || !pin) {
      return res.status(400).json({ error: 'Complete address is required' });
    }
    const makeDefault = isDefault || req.user.addresses.length === 0;
    if (makeDefault) req.user.addresses.forEach(a => { a.isDefault = false; });
    req.user.addresses.push({ label: label || 'Home', line1, city, state, pin, isDefault: makeDefault });
    await req.user.save();
    res.json({ success: true, addresses: req.user.addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/addresses/:addressId', requireAuth, async (req, res) => {
  try {
    const addr = req.user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ error: 'Address not found' });

    const { label, line1, city, state, pin, isDefault } = req.body;
    if (label !== undefined) addr.label = label;
    if (line1 !== undefined) addr.line1 = line1;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (pin !== undefined) addr.pin = pin;
    if (isDefault) req.user.addresses.forEach(a => { a.isDefault = String(a._id) === req.params.addressId; });

    await req.user.save();
    res.json({ success: true, addresses: req.user.addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/addresses/:addressId', requireAuth, async (req, res) => {
  try {
    const addr = req.user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ error: 'Address not found' });
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    if (wasDefault && req.user.addresses.length > 0) req.user.addresses[0].isDefault = true;
    await req.user.save();
    res.json({ success: true, addresses: req.user.addresses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Premium Membership ──────────────────────────────────────────────────────
// No payment gateway is wired in yet — this mirrors the site's existing
// checkout pattern (customer "subscribes", admin manually confirms payment
// received, exactly like COD/QR orders today).

router.post('/membership/subscribe', requireAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!MEMBERSHIP_PLANS[tier]) return res.status(400).json({ error: 'Invalid membership tier' });

    req.user.membership.tier = tier;
    req.user.membership.status = 'pending';
    req.user.membership.payments.push({ tier, amount: MEMBERSHIP_PLANS[tier], status: 'pending' });
    await req.user.save();
    res.json({ success: true, membership: req.user.membership });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({ data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/membership/:userId/confirm', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastPayment = user.membership.payments[user.membership.payments.length - 1];
    if (!lastPayment || lastPayment.status !== 'pending') {
      return res.status(400).json({ error: 'No pending membership payment for this user' });
    }

    lastPayment.status = 'paid';
    lastPayment.paidAt = new Date();
    user.membership.status = 'active';
    user.membership.startDate = new Date();
    user.membership.renewalDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ success: true, membership: user.membership });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = { router, requireAuth };
