const express = require('express');
const router = express.Router();
const PaymentSettings = require('../models/PaymentSettings');
const adminAuth = require('../middleware/auth');
const { logAdminAction } = require('../utils/auditLog');

// GET /api/payment-settings — public, powers the checkout's "Pay via UPI"
// option. Returns an empty upiId until an admin has actually set one, so the
// frontend knows to hide the option until then.
router.get('/', async (req, res) => {
  try {
    const settings = await PaymentSettings.findById('default').lean();
    res.json({ upiId: settings?.upiId || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/payment-settings — admin only.
router.patch('/', adminAuth, async (req, res) => {
  try {
    const { upiId } = req.body;
    const settings = await PaymentSettings.findByIdAndUpdate(
      'default',
      { upiId: upiId || '' },
      { upsert: true, new: true }
    );
    logAdminAction(req.admin.email, 'payment-settings.update', 'default', settings.upiId || '(no UPI ID set)');
    res.json({ success: true, upiId: settings.upiId || '' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
