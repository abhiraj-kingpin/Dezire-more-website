const mongoose = require('mongoose');

// Singleton document (always _id: 'default') backing the manual "Pay via
// UPI" checkout option -- a direct-to-bank-account alternative to Razorpay
// with no gateway fee, admin-managed instead of hardcoded so the UPI ID can
// be updated without a redeploy. The QR itself isn't stored as an image --
// it's generated client-side from this UPI ID plus the actual order amount
// (see the UPI deep link built in Navbar.jsx), so it always reflects the
// real total instead of being a static "scan and type the amount yourself"
// image. The option only appears at checkout once an admin has set a UPI ID
// (see GET /api/payment-settings).
const paymentSettingsSchema = new mongoose.Schema(
  {
    _id:   { type: String, default: 'default' },
    upiId: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
