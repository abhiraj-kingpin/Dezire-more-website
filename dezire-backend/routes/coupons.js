const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const adminAuth = require('../middleware/auth');
const { logAdminAction } = require('../utils/auditLog');

async function resolveCoupon(code, subtotal) {
  if (!code) return { error: null, discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon || !coupon.isActive) return { error: 'Invalid coupon code' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: 'This coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { error: 'This coupon has reached its usage limit' };
  if (subtotal < coupon.minOrderValue) {
    return { error: `Add ₹${(coupon.minOrderValue - subtotal).toLocaleString('en-IN')} more to use this coupon` };
  }

  let discount = coupon.type === 'percent' ? Math.round(subtotal * (coupon.value / 100)) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  return { error: null, discount, coupon };
}

router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Enter a coupon code' });
    const result = await resolveCoupon(code, Number(subtotal) || 0);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ valid: true, discount: result.discount, code: result.coupon.code, type: result.coupon.type, value: result.coupon.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .select('code type value minOrderValue maxDiscount expiresAt usageLimit usedCount')
      .lean();

    const available = coupons
      .filter(c => !c.usageLimit || c.usedCount < c.usageLimit)
      .map(({ code, type, value, minOrderValue, maxDiscount, expiresAt }) => ({
        code, type, value, minOrderValue, maxDiscount, expiresAt,
      }));

    res.json({ data: available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ data: coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { code, type, value, minOrderValue, maxDiscount, expiresAt, usageLimit } = req.body;
    if (!code || !type || !value) return res.status(400).json({ error: 'Code, type, and value are required' });
    const coupon = await Coupon.create({ code, type, value, minOrderValue, maxDiscount, expiresAt, usageLimit });
    logAdminAction(req.admin.email, 'coupon.create', coupon._id, coupon.code);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A coupon with this code already exists' });
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['type', 'value', 'minOrderValue', 'maxDiscount', 'expiresAt', 'usageLimit', 'isActive'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    logAdminAction(req.admin.email, 'coupon.update', coupon._id, `${coupon.code}: ${Object.keys(updates).join(', ')}`);
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    logAdminAction(req.admin.email, 'coupon.delete', coupon._id, coupon.code);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = { router, resolveCoupon };
