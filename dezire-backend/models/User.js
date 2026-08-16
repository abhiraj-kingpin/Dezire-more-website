const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label:     { type: String, default: 'Home', trim: true },
    line1:     { type: String, required: true, trim: true },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pin:       { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the price when the item was wishlisted. lastNotifiedPrice
    // only moves when an alert email actually goes out, so a price that
    // dips and recovers doesn't get silently "used up" without a notification.
    priceAtAdd: { type: Number, required: true },
    lastNotifiedPrice: { type: Number },
    // Tracked so the watcher can detect a false→true transition (genuinely
    // "back in stock") instead of emailing about items that were never out.
    lastKnownInStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Fallback "for your reference" saved payment method — used only while
// Razorpay isn't configured (see routes/paymentMethods.js). Nothing here is
// ever charged automatically; it's just a label the customer can glance at
// during checkout, same spirit as a manually-entered UPI ID.
const savedPaymentMethodSchema = new mongoose.Schema(
  {
    label:     { type: String, required: true, trim: true },
    last4:     { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const membershipPaymentSchema = new mongoose.Schema(
  {
    tier:   { type: String, enum: ['gold', 'platinum'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paidAt: { type: Date },
    // UTR/transaction reference the customer submits after paying via the
    // manual UPI QR flow — same purpose as Order.paymentReference.
    paymentReference: { type: String, trim: true },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, trim: true, default: '' },
    phone:        { type: String, trim: true, default: '' },

    // Gated behind OTP verification at signup — unverified accounts can't log in.
    emailVerified: { type: Boolean, default: false },

    addresses: [addressSchema],
    wishlist: [wishlistItemSchema],

    // Set the first time this user's Razorpay Customer record is
    // created/looked up (see services/razorpayCustomer.js) — reused after
    // that so repeat checkouts/token lookups hit the same Razorpay customer
    // instead of creating a new one every time.
    razorpayCustomerId: { type: String, trim: true },
    // Only populated in the no-Razorpay-configured fallback mode.
    savedPaymentMethods: [savedPaymentMethodSchema],

    notificationsEnabled: { type: Boolean, default: true },

    // FCM device tokens for the Android app — an array (not a single field)
    // since the same account can be logged in on more than one device.
    // Registered on login/app-open, removed on logout so a signed-out
    // device stops receiving pushes for that account.
    fcmTokens: { type: [String], default: [] },

    membership: {
      tier:        { type: String, enum: ['none', 'gold', 'platinum'], default: 'none' },
      status:      { type: String, enum: ['inactive', 'pending', 'active', 'expired'], default: 'inactive' },
      startDate:   { type: Date },
      renewalDate: { type: Date },
      payments:    [membershipPaymentSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
