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

    paymentMethod: {
      type: String,
      enum: ['Pay Online (QR)', 'UPI', 'Online Banking', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: [
        'Order Placed', 'Payment Confirmed', 'Processing', 'Packed',
        'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
      ],
      default: 'Order Placed',
    },

    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ customerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
