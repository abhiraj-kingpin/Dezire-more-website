const mongoose = require('mongoose');

// Singleton document (always _id: 'default') backing the manual "Pay via
// UPI" checkout option -- a direct-to-bank-account alternative to Razorpay
// with no gateway fee, admin-managed instead of hardcoded so the QR/UPI ID
// can be updated without a redeploy. The option only appears at checkout
// once a QR image has actually been uploaded (see GET /api/payment-settings).
const paymentSettingsSchema = new mongoose.Schema(
  {
    _id:           { type: String, default: 'default' },
    upiId:         { type: String, trim: true },
    qrImage:       { type: String },
    qrImagePublicId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
