const express = require('express');
const router = express.Router();
const PaymentSettings = require('../models/PaymentSettings');
const adminAuth = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');
const { logAdminAction } = require('../utils/auditLog');

// GET /api/payment-settings — public, powers the checkout's "Pay via UPI"
// option. Returns empty fields until an admin has actually configured
// something, so the frontend knows to hide the option until then.
router.get('/', async (req, res) => {
  try {
    const settings = await PaymentSettings.findById('default').lean();
    res.json({ upiId: settings?.upiId || '', qrImage: settings?.qrImage || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/payment-settings — admin only. QR image upload optional; a new
// one replaces (and deletes) the old Cloudinary asset, if there was one.
router.patch('/', adminAuth, upload.single('qrImage'), async (req, res) => {
  try {
    let settings = await PaymentSettings.findById('default');
    if (!settings) settings = new PaymentSettings({ _id: 'default' });

    const { upiId } = req.body;
    if (upiId !== undefined) settings.upiId = upiId;

    if (req.file) {
      if (settings.qrImagePublicId) {
        await cloudinary.uploader.destroy(settings.qrImagePublicId).catch(() => {});
      }
      settings.qrImage = req.file.path;
      settings.qrImagePublicId = req.file.filename;
    }

    await settings.save();
    logAdminAction(req.admin.email, 'payment-settings.update', 'default', settings.upiId || '(no UPI ID set)');
    res.json({ success: true, upiId: settings.upiId || '', qrImage: settings.qrImage || '' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
