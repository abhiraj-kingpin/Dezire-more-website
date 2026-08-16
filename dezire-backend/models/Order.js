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
        // GST — computed server-side at order creation (see routes/orders.js
        // GST_RATE_THRESHOLD), never trusted from the client: 5% below
        // ₹2,499, 18% at/above it, based on this item's own unit price.
        gstRate:   { type: Number },
        gstAmount: { type: Number },
      },
    ],

    address: {
      line1: { type: String, required: true },
      city:  { type: String, required: true },
      state: { type: String, required: true },
      pin:   { type: String, required: true },
    },

    subtotal:       { type: Number, required: true },
    // GST total and its 5%/18% split — see the items[].gstRate/gstAmount
    // comment above for how each item's rate is picked. gst5+gst18 always
    // equals totalGST; kept as two fields (rather than derived on read)
    // since the admin GST report (Section 10.2 of the spec) and the emailed
    // invoice both need the split, not just the sum.
    totalGST:       { type: Number, required: true, default: 0 },
    gstBreakdown: {
      gst5:  { type: Number, default: 0 },
      gst18: { type: Number, default: 0 },
    },
    deliveryCharge: { type: Number, required: true, default: 0 },
    total:          { type: Number, required: true },
    couponCode:     { type: String },
    discountAmount: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      // COD is no longer offered at checkout (UPI-only, via Razorpay — see
      // POST / below) but stays a valid enum value so historical COD orders
      // still pass validation on updates. Same for 'Pay Online (QR)' /
      // 'Online Banking' / manual 'UPI' — all superseded by Razorpay, kept
      // valid only for orders placed before/during each transition.
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
    // What the customer claims they paid, entered alongside paymentReference
    // for manual UPI orders — compared against `total` by the admin against
    // their real bank/UPI app, not validated automatically (there's nothing
    // to validate it against on this end).
    amountPaid: { type: Number },
    // Audit trail for PATCH /orders/admin/:id/verify-payment — who manually
    // confirmed a manual-reference payment actually landed, and when.
    paymentVerifiedAt: { type: Date },
    paymentVerifiedBy: { type: String, trim: true },
    // Razorpay's own order for this purchase — created right after our
    // Order exists so its amount can't be tampered with client-side.
    razorpayOrderId: { type: String },
    // Set once the payment signature is verified (checkout callback or
    // webhook, whichever arrives first) — this is what actually flips
    // paymentStatus to 'paid', not a client-asserted claim.
    razorpayPaymentId: { type: String },

    // Customer-initiated "remove from my order history" — orders stay
    // intact for business/audit records (admin panel, revenue analytics,
    // etc. never look at this field), it just filters out of the
    // customer's own GET /orders list.
    hiddenFromCustomer: { type: Boolean, default: false },

    orderStatus: {
      type: String,
      enum: [
        'Order Placed', 'Payment Confirmed', 'Processing', 'Packed',
        'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
      ],
      default: 'Order Placed',
    },

    estimatedDelivery: { type: Date },
    // Set the moment an admin marks the order Delivered — kept separate
    // from createdAt/updatedAt (which change for unrelated reasons) so the
    // order timeline can show the real delivery date.
    deliveredAt: { type: Date },

    isGift:      { type: Boolean, default: false },
    giftMessage: { type: String, trim: true },

    // Optional, customer-provided when they cancel their own order —
    // useful for admin analytics, never required to actually cancel.
    cancellationReason: { type: String, trim: true },

    // Populated once an admin creates a real Shiprocket shipment for this
    // order (see services/shiprocket.js) — absent for orders shipped
    // before this existed, or for a site that hasn't configured
    // SHIPROCKET_EMAIL/PASSWORD at all.
    shipment: {
      // Which path produced this shipment — lets admin's Track/Cancel
      // buttons call the right service without guessing from the data
      // shape. Absent on shipments created before this field existed.
      provider:            { type: String, enum: ['shiprocket', 'delhivery', 'manual'] },
      shiprocketOrderId:   { type: String },
      shiprocketShipmentId: { type: String },
      awbCode:             { type: String },
      courierName:         { type: String },
      trackingUrl:         { type: String },
      lastTrackingStatus:  { type: String },
      lastTrackingUpdate:  { type: Date },
    },
  },
  { timestamps: true }
);

orderSchema.index({ customerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
