const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema(
  {
    _id:   { type: String, default: 'default' },
    upiId: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
