const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const adminAuth = require('../middleware/auth');
const { sendOrderConfirmationEmail, sendAdminOrderAlert } = require('../utils/notifications');

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
      paymentMethod, paymentStatus,
    } = req.body;

    if (!customerEmail || !customerName || !customerPhone) {
      return res.status(400).json({ error: 'Customer details are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const itemError = validateItems(items);
    if (itemError) return res.status(400).json({ error: itemError });

    const existingCount = await Product.countDocuments({
      _id: { $in: items.map(item => item.productId) },
    });
    if (existingCount !== new Set(items.map(item => item.productId)).size) {
      return res.status(400).json({ error: 'One or more items in this order no longer exist' });
    }

    if (!address?.line1 || !address?.city || !address?.state || !address?.pin) {
      return res.status(400).json({ error: 'Complete delivery address is required' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

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
      total,
      paymentMethod,
      paymentStatus: resolvedPaymentStatus,
      orderStatus: resolvedPaymentStatus === 'paid' ? 'Payment Confirmed' : 'Order Placed',
      estimatedDelivery: estimatedDeliveryDate(),
    });

    // Fire-and-forget — a slow/unconfigured mail server should never block
    // or fail the order response.
    sendOrderConfirmationEmail(order).catch(err => console.error('[order email]', err.message));
    sendAdminOrderAlert(order).catch(err => console.error('[admin alert]', err.message));

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders?email=customer@example.com — a customer's own order history
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email query parameter is required' });

    const orders = await Order.find({ customerEmail: email.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
