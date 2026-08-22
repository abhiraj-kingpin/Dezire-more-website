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
      enum: ['Pay Online (QR)', 'UPI', 'Online Banking', 'Razorpay', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentReference: { type: String, trim: true },
    amountPaid: { type: Number },
    paymentVerifiedAt: { type: Date },
    paymentVerifiedBy: { type: String, trim: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

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
    deliveredAt: { type: Date },

    isGift:      { type: Boolean, default: false },
    giftMessage: { type: String, trim: true },

    cancellationReason: { type: String, trim: true },

    shipment: {
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
