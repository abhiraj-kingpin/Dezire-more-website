const mongoose = require('mongoose');

// Formalizes the exchange flow that previously only existed as a WhatsApp
// message — the site's Exchange Policy page has always advertised a 3-day
// window and a defined review process, but there was nothing tracking a
// request's status once sent. Refunds aren't offered (see Exchange Policy),
// only replacement/exchange, so there's no amount/refund field here.
const exchangeSchema = new mongoose.Schema(
  {
    orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true },

    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerName:  { type: String, required: true },
    customerPhone: { type: String, required: true },

    productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    size:        { type: String },
    color:       { type: String },

    reason: {
      type: String,
      enum: ['wrong-item', 'defective', 'size-mismatch', 'other'],
      required: true,
    },
    description: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected', 'Completed'],
      default: 'Requested',
    },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

exchangeSchema.index({ customerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Exchange', exchangeSchema);
