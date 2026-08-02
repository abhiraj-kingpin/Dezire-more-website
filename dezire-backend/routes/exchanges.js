const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exchange = require('../models/Exchange');
const Order = require('../models/Order');
const adminAuth = require('../middleware/auth');
const { requireAuth } = require('./auth');
const { sendExchangeStatusEmail } = require('../utils/notifications');
const { logAdminAction } = require('../utils/auditLog');

const EXCHANGE_WINDOW_DAYS = 3; // matches the site's Exchange Policy page

function publicExchange(e) {
  return {
    id: e._id,
    orderId: e.orderId,
    orderNumber: e.orderNumber,
    productName: e.productName,
    size: e.size,
    color: e.color,
    reason: e.reason,
    description: e.description,
    status: e.status,
    adminNote: e.adminNote,
    createdAt: e.createdAt,
  };
}

// POST /api/exchanges — customer raises an exchange request for a delivered
// item, within the policy's 3-day window.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { orderId, productId, reason, description } = req.body;
    if (!orderId || !reason || !description?.trim()) {
      return res.status(400).json({ error: 'Order, reason, and a description are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order reference' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }
    if (order.orderStatus !== 'Delivered' || !order.deliveredAt) {
      return res.status(400).json({ error: 'Exchanges can only be raised for delivered orders' });
    }
    const daysSinceDelivery = (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > EXCHANGE_WINDOW_DAYS) {
      return res.status(400).json({ error: `The ${EXCHANGE_WINDOW_DAYS}-day exchange window for this order has passed` });
    }

    const item = productId
      ? order.items.find(i => String(i.productId) === String(productId))
      : order.items[0];
    if (!item) return res.status(400).json({ error: 'Item not found on this order' });

    const exchange = await Exchange.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerEmail: req.user.email,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productId: item.productId,
      productName: item.name,
      size: item.size,
      color: item.color,
      reason,
      description: description.trim(),
    });

    res.status(201).json({ success: true, exchange: publicExchange(exchange) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/exchanges — the logged-in customer's own exchange requests
router.get('/', requireAuth, async (req, res) => {
  try {
    const exchanges = await Exchange.find({ customerEmail: req.user.email }).sort({ createdAt: -1 }).lean();
    res.json({ data: exchanges.map(publicExchange) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const exchanges = await Exchange.find().sort({ createdAt: -1 }).lean();
    res.json({ data: exchanges, total: exchanges.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['Requested', 'Approved', 'Rejected', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Exchange request not found' });

    const previousStatus = exchange.status;
    exchange.status = status;
    if (adminNote !== undefined) exchange.adminNote = adminNote;
    await exchange.save();

    logAdminAction(req.admin.email, 'exchange.status', exchange._id, `${previousStatus} → ${status}`);
    sendExchangeStatusEmail(exchange).catch(err => console.error('[exchange status email]', err.message));

    res.json({ success: true, exchange: publicExchange(exchange) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/exchanges/admin/:id — removes a stray/duplicate/test request
// from the list. Status changes (Approved/Rejected/Completed) above are the
// normal way to resolve a real customer request; this is for cleaning up
// entries that shouldn't be there at all, not a substitute for Reject.
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const exchange = await Exchange.findByIdAndDelete(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Exchange request not found' });
    logAdminAction(req.admin.email, 'exchange.delete', exchange._id, `${exchange.orderNumber}: ${exchange.productName}`);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
