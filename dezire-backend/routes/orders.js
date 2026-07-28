const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const adminAuth = require('../middleware/auth');
const { requireAuth } = require('./auth');
const { resolveCoupon } = require('./coupons');
const Coupon = require('../models/Coupon');
const { sendOrderConfirmationEmail, sendAdminOrderAlert } = require('../utils/notifications');

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

// POST /api/orders — create an order once payment is confirmed client-side
router.post('/', async (req, res) => {
  try {
    const {
      customerEmail, customerName, customerPhone,
      items, address, subtotal, deliveryCharge, total,
      paymentMethod, paymentStatus, isGift, giftMessage, couponCode,
    } = req.body;

    if (!customerEmail || !customerName || !customerPhone) {
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

    // COD orders start "pending"; anything the customer has already paid
    // for (QR / UPI / online banking) is trusted as "paid" since there is
    // no payment gateway wired in yet to verify server-side.
    const resolvedPaymentStatus = paymentMethod === 'COD' ? 'pending' : (paymentStatus || 'paid');

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
      paymentStatus: resolvedPaymentStatus,
      orderStatus: resolvedPaymentStatus === 'paid' ? 'Payment Confirmed' : 'Order Placed',
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

    order.orderStatus = 'Cancelled';
    await order.save();
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

// PATCH /api/orders/:id/status — admin updates order lifecycle status
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updates = {};
    if (orderStatus) updates.orderStatus = orderStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
