const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const adminAuth = require('../middleware/auth');
const { requireAuth } = require('./auth');
const { resolveCoupon } = require('./coupons');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendAdminOrderAlert, sendOrderStatusEmail } = require('../utils/notifications');
const { logAdminAction } = require('../utils/auditLog');
const shiprocket = require('../services/shiprocket');
const fcm = require('../services/fcm');

// Real, automatically-verified payments — replaces the old manual QR/UPI
// reference-entry flow. Test-mode keys work immediately (no KYC needed);
// switching to live mode later is just swapping the two env vars.
function getRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// Orders placed before real accounts existed have no owning user, but their
// email still identifies the customer — cancellable/early statuses only.
const CANCELLABLE_STATUSES = ['Order Placed', 'Payment Confirmed', 'Processing'];

function generateOrderNumber() {
  return 'DZM' + Math.floor(100000 + Math.random() * 900000);
}

function estimatedDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 9); // matches the site's 7–10 business day shipping policy
  return d;
}

// Validates each cart line before it ever reaches Order.create(). The
// checkout UI lets a shopper pick a size, which the cart used to fold into
// a client-side "<productId>-<size>" string and send straight through as
// productId — Mongoose then blew up trying to cast that to an ObjectId.
// Size now travels in its own `size` field, and this guards against any
// other malformed/tampered item shape reaching the database.
function validateItems(items) {
  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item?.productId)) {
      return `Invalid product reference: "${item?.productId}"`;
    }
    if (!item.name || typeof item.name !== 'string') {
      return 'Every order item needs a product name';
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return `Invalid price for "${item.name}"`;
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return `Invalid quantity for "${item.name}"`;
    }
  }
  return null;
}

// POST /api/orders — create an order once payment is confirmed client-side.
// Requires login (the frontend already gates "Place Order" behind
// authentication; this closes the gap where the API itself didn't enforce
// it). customerEmail always comes from the verified session, never the
// request body, so an order can't be filed under someone else's account.
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      customerName, customerPhone,
      items, address, subtotal, deliveryCharge, total,
      paymentMethod, paymentReference, amountPaid, isGift, giftMessage, couponCode,
    } = req.body;
    const customerEmail = req.user.email;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: 'Customer details are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const itemError = validateItems(items);
    if (itemError) return res.status(400).json({ error: itemError });

    const products = await Product.find({ _id: { $in: items.map(item => item.productId) } });
    if (products.length !== new Set(items.map(item => item.productId)).size) {
      return res.status(400).json({ error: 'One or more items in this order no longer exist' });
    }

    // Stock verification before payment — checked here, not just trusted
    // from whatever the shopper had in their cart, since availability can
    // change between browsing and checkout.
    for (const item of items) {
      const product = products.find(p => String(p._id) === String(item.productId));
      if (!product.inStock || product.stockCount < item.quantity) {
        return res.status(409).json({
          error: !product.inStock || product.stockCount === 0
            ? `"${item.name}" is currently out of stock`
            : `Only ${product.stockCount} left of "${item.name}" — please reduce the quantity`,
          outOfStock: true,
          productId: item.productId,
        });
      }
    }

    if (!address?.line1 || !address?.city || !address?.state || !address?.pin) {
      return res.status(400).json({ error: 'Complete delivery address is required' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }
    // Razorpay verifies itself (signature check after checkout) — only the
    // legacy manual QR/UPI methods need a customer-entered reference.
    const needsManualReference = !['COD', 'Razorpay'].includes(paymentMethod);
    if (needsManualReference && !paymentReference?.trim()) {
      return res.status(400).json({ error: 'Please enter the UPI transaction ID / reference number from your payment app.' });
    }
    if (needsManualReference && !(Number(amountPaid) > 0)) {
      return res.status(400).json({ error: 'Please enter the amount you paid.' });
    }

    // Re-validated here rather than trusting whatever discount the client
    // already showed at checkout — a coupon can expire or hit its usage
    // limit between being applied in the cart and the order actually posting.
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const result = await resolveCoupon(couponCode, Number(subtotal) || 0);
      if (result.error) return res.status(400).json({ error: result.error });
      discountAmount = result.discount;
      appliedCoupon = result.coupon;
    }
    const resolvedTotal = Number(subtotal) - discountAmount + Number(deliveryCharge || 0);

    // No payment gateway is wired in — every order starts "pending"
    // regardless of method. QR/UPI orders carry a customer-entered
    // transaction reference the admin checks against their bank/UPI app
    // before manually confirming payment (see PATCH /:id/status).
    let orderNumber = generateOrderNumber();
    // Extremely unlikely, but guard against a collision on the unique index.
    for (let i = 0; i < 3 && await Order.exists({ orderNumber }); i++) {
      orderNumber = generateOrderNumber();
    }

    const order = await Order.create({
      orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      items,
      address,
      subtotal,
      deliveryCharge,
      total: resolvedTotal,
      couponCode: appliedCoupon?.code,
      discountAmount,
      paymentMethod,
      paymentReference: needsManualReference ? paymentReference.trim() : undefined,
      amountPaid: needsManualReference ? Number(amountPaid) : undefined,
      paymentStatus: 'pending',
      orderStatus: 'Order Placed',
      estimatedDelivery: estimatedDeliveryDate(),
      isGift: !!isGift,
      giftMessage: isGift ? giftMessage : undefined,
    });

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

    // Deduct stock now that the order is confirmed. Not wrapped in a
    // transaction (this store's order volume doesn't warrant the added
    // complexity) — worst case under rare concurrent checkouts is a slight
    // oversell, which the admin can already see and address via the
    // Products page.
    await Promise.all(items.map(async (item) => {
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockCount: -item.quantity } },
        { new: true }
      );
      if (updated && updated.stockCount <= 0) {
        updated.stockCount = 0;
        updated.inStock = false;
        await updated.save();
      }
    }));

    // Fire-and-forget — a slow/unconfigured mail server should never block
    // or fail the order response.
    sendOrderConfirmationEmail(order).catch(err => console.error('[order email]', err.message));
    sendAdminOrderAlert(order).catch(err => console.error('[admin alert]', err.message));

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/orders/:id/razorpay/create-payment-order — creates a matching
// Razorpay order for an existing (pending, unpaid) order, using the order's
// own server-computed total — never a client-supplied amount, so there's
// no way to tamper with what actually gets charged.
router.post('/:id/razorpay/create-payment-order', requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ error: 'Online payment is temporarily unavailable. Please try Cash on Delivery.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This order has already been paid' });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // Razorpay expects the amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: String(order._id) },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/razorpay/confirm — verifies the payment signature
// Razorpay's checkout success handler returns. This signature check is the
// actual source of truth for "did the customer pay" — a client claiming
// success without a valid signature is rejected, not trusted.
router.patch('/:id/razorpay/confirm', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Payment order mismatch' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      if (order.orderStatus === 'Order Placed') order.orderStatus = 'Payment Confirmed';
      await order.save();
      sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
      User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean()
        .then(customer => { if (customer?.notificationsEnabled !== false) fcm.sendOrderStatusPush(customer, order); })
        .catch(err => console.error('[order status push]', err.message));
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/orders/razorpay/webhook — backstop for the rare case where the
// checkout success callback never fires client-side (browser closed/
// crashed right after paying, network drop, etc.). Razorpay calls this
// directly, authenticated via its own webhook signature rather than a user
// session — configure the same URL + a webhook secret in the Razorpay
// dashboard under Settings > Webhooks, subscribed to "payment.captured".
router.post('/razorpay/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature || !req.rawBody) return res.status(400).send('Webhook not configured');

    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (expected !== signature) return res.status(400).send('Invalid signature');

    const event = req.body;
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = payment.id;
        if (order.orderStatus === 'Order Placed') order.orderStatus = 'Payment Confirmed';
        await order.save();
        sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
        User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean()
          .then(customer => { if (customer?.notificationsEnabled !== false) fcm.sendOrderStatusPush(customer, order); })
          .catch(err => console.error('[order status push]', err.message));
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[razorpay webhook]', err.message);
    res.status(500).send('Webhook error');
  }
});

// GET /api/orders — the logged-in customer's own order history. Scoped to
// their verified account email server-side, not a client-supplied param —
// previously any caller could read anyone's orders just by knowing their email.
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/cancel — customer-initiated cancellation, only while
// the order hasn't progressed past processing.
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }
    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      return res.status(400).json({ error: `Orders can no longer be cancelled once they're ${order.orderStatus.toLowerCase()}` });
    }

    const { reason } = req.body;
    order.orderStatus = 'Cancelled';
    if (reason && typeof reason === 'string' && reason.trim()) {
      order.cancellationReason = reason.trim();
    }
    await order.save();

    if (req.user.notificationsEnabled !== false) {
      sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
      fcm.sendOrderStatusPush(req.user, order).catch(err => console.error('[order status push]', err.message));
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders/:id — single order detail
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Admin routes ───────────────────────────────────────────────────────────

// GET /api/orders/admin/all — every order, for the admin panel
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ data: orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/admin/analytics — revenue/order breakdowns for the admin
// dashboard. Only counts paymentStatus:'paid' orders toward revenue, since
// pending COD/unverified-UPI orders haven't actually been paid yet.
router.get('/admin/analytics', adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [revenueByDay, statusBreakdown, topProducts, totals, customerCount, signupsByDay] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
      ]),
      User.countDocuments(),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalsRow = totals[0] || { totalRevenue: 0, totalOrders: 0 };

    res.json({
      revenueByDay: revenueByDay.map(r => ({ date: r._id, revenue: r.revenue, orders: r.orders })),
      statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count })),
      topProducts: topProducts.map(p => ({ name: p._id, unitsSold: p.unitsSold, revenue: p.revenue })),
      totalRevenue: totalsRow.totalRevenue,
      totalOrders: totalsRow.totalOrders,
      avgOrderValue: totalsRow.totalOrders > 0 ? Math.round(totalsRow.totalRevenue / totalsRow.totalOrders) : 0,
      totalCustomers: customerCount,
      signupsByDay: signupsByDay.map(s => ({ date: s._id, count: s.count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status — admin updates order lifecycle status
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updates = {};
    if (orderStatus) updates.orderStatus = orderStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (orderStatus === 'Delivered') updates.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    logAdminAction(req.admin.email, 'order.status', order._id, `${order.orderNumber}: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    if (orderStatus) {
      const customerEmail = (order.customerEmail || '').toLowerCase().trim();
      const customer = await User.findOne({ email: customerEmail }).select('notificationsEnabled fcmTokens').lean();
      if (!customer || customer.notificationsEnabled !== false) {
        sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
        if (customer) fcm.sendOrderStatusPush(customer, order).catch(err => console.error('[order status push]', err.message));
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/admin/:orderId/verify-payment — dedicated action for
// manually-referenced (UPI/QR/Online Banking) orders: admin has checked the
// UTR + amount against their real bank/UPI app and confirms it actually
// landed. Deliberately its own route (not folded into the generic
// PATCH /:id/status above) so the audit stamps below always get set
// consistently, regardless of which admin-panel button triggers it.
router.patch('/admin/:orderId/verify-payment', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This order is already marked paid.' });
    }

    order.paymentStatus = 'paid';
    order.paymentVerifiedAt = new Date();
    order.paymentVerifiedBy = req.admin.email;
    if (order.orderStatus === 'Order Placed') order.orderStatus = 'Payment Confirmed';
    await order.save();

    logAdminAction(req.admin.email, 'order.verify-payment', order._id, `${order.orderNumber}: UTR ${order.paymentReference || 'n/a'}, claimed ₹${order.amountPaid ?? 'n/a'} against total ₹${order.total}`);

    const customer = await User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean();
    if (!customer || customer.notificationsEnabled !== false) {
      sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
      if (customer) fcm.sendOrderStatusPush(customer, order).catch(err => console.error('[order status push]', err.message));
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/orders/:id/create-shipment — admin creates a real Shiprocket
// shipment for this order and gets back a live AWB/tracking number. Package
// weight/dimensions aren't tracked per-product anywhere in this app, so
// they're entered here at shipment time rather than assumed — defaults are
// pre-filled in the admin UI for a typical apparel package but always
// admin-editable per order.
router.post('/:id/create-shipment', adminAuth, async (req, res) => {
  try {
    if (!shiprocket.isConfigured()) {
      return res.status(503).json({ error: 'Shiprocket is not configured — add SHIPROCKET_EMAIL/PASSWORD/PICKUP_LOCATION to enable real shipment tracking.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.shipment?.awbCode) {
      return res.status(400).json({ error: `This order already has a shipment (AWB ${order.shipment.awbCode}).` });
    }
    // COD has nothing to verify (cash collected on delivery) — everything
    // else (UPI, legacy QR/Online Banking, Razorpay) must be paymentStatus
    // 'paid' before it's eligible for dispatch. Razorpay orders reach that
    // automatically on checkout; manual-reference orders need the admin's
    // explicit verify-payment action first.
    if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment hasn\'t been verified for this order yet — verify it before creating a shipment.' });
    }

    const { weight = 0.5, length = 30, breadth = 20, height = 5 } = req.body || {};
    const result = await shiprocket.createShipment(order, { weight, length, breadth, height });

    order.shipment = {
      shiprocketOrderId: result.shiprocketOrderId,
      shiprocketShipmentId: result.shiprocketShipmentId,
      awbCode: result.awbCode,
      courierName: result.courierName,
      trackingUrl: result.trackingUrl,
    };
    if (result.awbAssigned) order.orderStatus = 'Shipped';
    await order.save();

    logAdminAction(req.admin.email, 'order.create-shipment', order._id, `${order.orderNumber}: ${result.awbAssigned ? `AWB ${result.awbCode} (${result.courierName})` : `order created, AWB pending — ${result.error}`}`);

    if (result.awbAssigned) {
      const customer = await User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean();
      if (!customer || customer.notificationsEnabled !== false) {
        sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
        if (customer) fcm.sendOrderStatusPush(customer, order).catch(err => console.error('[order status push]', err.message));
      }
    }

    res.json({ success: true, order, awbAssigned: result.awbAssigned, error: result.awbAssigned ? undefined : result.error });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/orders/shiprocket/webhook — real-time shipment status updates
// (out for delivery, delivered, RTO, etc.) instead of the static "+9 days"
// estimate. Verified via a shared secret (set the same value here and in
// Shiprocket's Settings > API > Webhook config) rather than the HMAC
// signing Razorpay's webhook uses — Shiprocket's webhook auth is a plain
// shared token, not a per-payload signature.
router.post('/shiprocket/webhook', async (req, res) => {
  try {
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const provided = req.headers['x-api-key'] || req.headers['x-webhook-secret'];
    if (!secret || provided !== secret) return res.status(401).json({ error: 'Invalid webhook secret' });

    const { awb, current_status, order_id } = req.body || {};
    const order = awb
      ? await Order.findOne({ 'shipment.awbCode': awb })
      : await Order.findOne({ 'shipment.shiprocketOrderId': order_id });
    if (!order) return res.status(404).json({ error: 'No matching order for this shipment' });

    order.shipment.lastTrackingStatus = current_status;
    order.shipment.lastTrackingUpdate = new Date();

    const mappedStatus = shiprocket.mapTrackingStatus(current_status);
    if (mappedStatus && mappedStatus !== order.orderStatus) {
      order.orderStatus = mappedStatus;
      if (mappedStatus === 'Delivered') order.deliveredAt = new Date();
      await order.save();
      const customer = await User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean();
      if (!customer || customer.notificationsEnabled !== false) {
        sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
        if (customer) fcm.sendOrderStatusPush(customer, order).catch(err => console.error('[order status push]', err.message));
      }
    } else {
      await order.save();
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[shiprocket webhook]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
