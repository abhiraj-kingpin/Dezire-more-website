const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerName:  { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name:      { type: String, required: true },
        image:     { type: String },
        price:     { type: Number, required: true },
        quantity:  { type: Number, required: true, min: 1 },
        size:      { type: String },
        color:     { type: String },
      },
    ],

    address: {
      line1: { type: String, required: true },
      city:  { type: String, required: true },
      state: { type: String, required: true },
      pin:   { type: String, required: true },
    },

    subtotal:       { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 0 },
    total:          { type: Number, required: true },
    couponCode:     { type: String },
    discountAmount: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      // 'Pay Online (QR)'/'Online Banking' kept valid only so historical
      // orders placed before Razorpay still pass validation on updates.
      // 'UPI' is frontend-selectable again as the manual bank-transfer
      // option (scan QR / pay to a UPI ID, customer enters a reference,
      // admin confirms manually) -- a zero-gateway-fee alternative to
      // Razorpay, admin-configured via PaymentSettings.
      enum: ['Pay Online (QR)', 'UPI', 'Online Banking', 'Razorpay', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    // UPI/UTR transaction reference the customer enters after paying via the
    // old manual QR/UPI flow — superseded by Razorpay's own verified
    // payment IDs below for new orders, kept for historical ones.
    paymentReference: { type: String, trim: true },
    // Razorpay's own order for this purchase — created right after our
    // Order exists so its amount can't be tampered with client-side.
    razorpayOrderId: { type: String },
    // Set once the payment signature is verified (checkout callback or
    // webhook, whichever arrives first) — this is what actually flips
    // paymentStatus to 'paid', not a client-asserted claim.
    razorpayPaymentId: { type: String },

    orderStatus: {
      type: String,
      enum: [
        'Order Placed', 'Payment Confirmed', 'Processing', 'Packed',
        'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
      ],
      default: 'Order Placed',
    },

    estimatedDelivery: { type: Date },
    // Set the moment an admin marks the order Delivered — the exchange
    // window (3 days, per the site's Exchange Policy) is measured from this,
    // not from createdAt/updatedAt which change for unrelated reasons.
    deliveredAt: { type: Date },

    isGift:      { type: Boolean, default: false },
    giftMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ customerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
