const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Product = require('../models/Product');
const VerificationToken = require('../models/VerificationToken');
const adminAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sendVerificationEmail } = require('../utils/notifications');
const { logAdminAction } = require('../utils/auditLog');

const VERIFICATION_TTL_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;
const MEMBERSHIP_PLANS = { gold: 20000, platinum: 30000 };
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.deziremore.com';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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

async function issueVerificationLink(email) {
  const recent = await VerificationToken.findOne({ email, purpose: 'signup' }).sort({ createdAt: -1 });
  if (recent) {
    const secondsSinceSent = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceSent);
      const err = new Error(`Please wait ${wait}s before requesting another email`);
      err.status = 429;
      throw err;
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  await VerificationToken.deleteMany({ email, purpose: 'signup' });
  await VerificationToken.create({
    email,
    tokenHash: hashToken(token),
    purpose: 'signup',
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
  });

  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  let result;
  try {
    result = await sendVerificationEmail(email, verifyUrl);
  } catch (err) {
    console.error(`[auth] Failed to send verification email to ${email}:`, err.message);
    result = { sent: false, reason: 'send-failed' };
  }
  if (!result.sent) console.warn(`[auth] Verification link for ${email}: ${verifyUrl} — email not sent (${result.reason}).`);
  return result;
}

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

async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (user) req.user = user;
    }
  } catch {
  }
  next();
}

router.post('/signup', authLimiter, async (req, res) => {
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

    const result = await issueVerificationLink(normalizedEmail);
    if (!result.sent) {
      return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again shortly.' });
    }

    res.json({ success: true, message: `A verification link was sent to ${normalizedEmail}`, email: normalizedEmail });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const record = await VerificationToken.findOne({ tokenHash: hashToken(token), purpose: 'signup' });
    if (!record) {
      return res.status(400).json({ error: 'This verification link is invalid or has already been used.', invalid: true });
    }
    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      return res.status(400).json({ error: 'This verification link has expired. Please request a new one.', expired: true, email: record.email });
    }

    const user = await User.findOne({ email: record.email });
    if (!user) return res.status(404).json({ error: 'Account not found — please sign up again.' });

    user.emailVerified = true;
    await user.save();
    await VerificationToken.deleteMany({ email: record.email, purpose: 'signup' });

    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-status', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email }).select('emailVerified').lean();
    res.json({ verified: !!user?.emailVerified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.emailVerified) {
      return res.status(400).json({ error: 'No pending signup found for this email' });
    }

    const result = await issueVerificationLink(normalizedEmail);
    if (!result.sent) return res.status(503).json({ error: 'Email verification is temporarily unavailable.' });

    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
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
        error: 'Please verify your email before logging in — check your inbox for the verification link.',
        needsVerification: true,
        email: normalizedEmail,
      });
    }

    res.json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

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

router.post('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'FCM token is required' });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { fcmTokens: token } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'FCM token is required' });
    await User.updateOne({ _id: req.user._id }, { $pull: { fcmTokens: token } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


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


router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const productIds = req.user.wishlist.map(w => w.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [String(p._id), p]));

    const items = req.user.wishlist
      .map(w => {
        const product = productMap.get(String(w.productId));
        if (!product) return null;
        return { ...product, id: product._id, priceAtAdd: w.priceAtAdd, wishlistedAt: w.createdAt };
      })
      .filter(Boolean);

    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/wishlist', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const already = req.user.wishlist.some(w => String(w.productId) === String(productId));
    if (already) return res.json({ success: true, added: false });

    const product = await Product.findById(productId).select('price inStock');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    req.user.wishlist.push({ productId, priceAtAdd: product.price, lastKnownInStock: product.inStock });
    await req.user.save();
    res.json({ success: true, added: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/wishlist/:productId', requireAuth, async (req, res) => {
  try {
    req.user.wishlist = req.user.wishlist.filter(w => String(w.productId) !== req.params.productId);
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


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

router.patch('/membership/reference', requireAuth, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference || !reference.trim()) return res.status(400).json({ error: 'Please enter a transaction reference' });

    const payments = req.user.membership.payments;
    const lastPayment = payments[payments.length - 1];
    if (!lastPayment || lastPayment.status !== 'pending') {
      return res.status(400).json({ error: 'No pending membership payment to attach a reference to' });
    }

    lastPayment.paymentReference = reference.trim();
    await req.user.save();
    res.json({ success: true, membership: req.user.membership });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({ data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    logAdminAction(req.admin.email, 'customer.delete', user._id, user.email);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
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

    logAdminAction(req.admin.email, 'membership.confirm', user._id, `${user.email}: ${lastPayment.tier}`);
    res.json({ success: true, membership: user.membership });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = { router, requireAuth, optionalAuth };
