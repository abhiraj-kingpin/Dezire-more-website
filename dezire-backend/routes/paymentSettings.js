const express = require('express');
const router = express.Router();
const PaymentSettings = require('../models/PaymentSettings');
const adminAuth = require('../middleware/auth');
const { logAdminAction } = require('../utils/auditLog');

router.get('/', async (req, res) => {
  try {
    const settings = await PaymentSettings.findById('default').lean();
    res.json({ upiId: settings?.upiId || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
