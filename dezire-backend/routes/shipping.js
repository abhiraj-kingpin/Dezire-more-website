const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const adminAuth = require('../middleware/auth');
const { sendOrderStatusEmail } = require('../utils/notifications');
const { logAdminAction } = require('../utils/auditLog');
const delhivery = require('../services/delhivery.service');
const fcm = require('../services/fcm');

// POST /api/shipping/create — admin creates a real Delhivery shipment for an
// order and gets back a live AWB/tracking number. A dedicated /api/shipping
// namespace (rather than nesting under /api/orders like Shiprocket's older
// route) so this and future courier integrations have one predictable place
// to live, per the agreed Delhivery-as-a-third-option scope.
router.post('/create', adminAuth, async (req, res) => {
  try {
    if (!delhivery.isConfigured()) {
      return res.status(503).json({ error: 'Delhivery is not configured — add DELHIVERY_API_TOKEN/DELHIVERY_PICKUP_LOCATION to enable it.' });
    }

    const { orderId, weight } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.shipment?.awbCode) {
      return res.status(400).json({ error: `This order already has a shipment (AWB ${order.shipment.awbCode}).` });
    }
    if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment hasn\'t been verified for this order yet — verify it before creating a shipment.' });
    }

    const result = await delhivery.createShipment(order, { weight });
    if (!result.awbAssigned) {
      return res.status(422).json({ error: result.error || 'Delhivery could not create this shipment' });
    }

    order.shipment = {
      provider: 'delhivery',
      awbCode: result.awbCode,
      courierName: result.courierName,
      trackingUrl: result.trackingUrl,
    };
    order.orderStatus = 'Shipped';
    await order.save();

    logAdminAction(req.admin.email, 'order.create-shipment', order._id, `${order.orderNumber}: AWB ${result.awbCode} (Delhivery)`);

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

// GET /api/shipping/:orderId — current shipment info stored on the order
// (a cheap DB read, not a live Delhivery call — use /track/:awb for that).
router.get('/:orderId', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select('orderNumber shipment').lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ orderNumber: order.orderNumber, shipment: order.shipment || null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/shipping/cancel — cancels the Delhivery shipment and reverts the
// order so it can be re-shipped (manually or via Delhivery again) rather
// than being stuck showing a dead AWB.
router.post('/cancel', adminAuth, async (req, res) => {
  try {
    if (!delhivery.isConfigured()) {
      return res.status(503).json({ error: 'Delhivery is not configured.' });
    }

    const { orderId } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.shipment?.provider !== 'delhivery' || !order.shipment?.awbCode) {
      return res.status(400).json({ error: 'This order has no Delhivery shipment to cancel.' });
    }

    const awbCode = order.shipment.awbCode;
    await delhivery.cancelShipment(awbCode);

    order.shipment = undefined;
    order.orderStatus = 'Processing';
    await order.save();

    logAdminAction(req.admin.email, 'order.cancel-shipment', order._id, `${order.orderNumber}: AWB ${awbCode} cancelled (Delhivery)`);

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/shipping/track/:awb — live status pull from Delhivery, also
// persisted onto the order so the customer-facing MyOrders page (which
// reads shipment.lastTrackingStatus, not a live call) reflects it too.
router.get('/track/:awb', adminAuth, async (req, res) => {
  try {
    if (!delhivery.isConfigured()) {
      return res.status(503).json({ error: 'Delhivery is not configured.' });
    }

    const tracking = await delhivery.trackShipment(req.params.awb);

    const order = await Order.findOne({ 'shipment.awbCode': req.params.awb });
    if (order) {
      order.shipment.lastTrackingStatus = tracking.status;
      order.shipment.lastTrackingUpdate = new Date();
      const mappedStatus = delhivery.mapTrackingStatus(tracking.statusType);
      if (mappedStatus) {
        order.orderStatus = mappedStatus;
        if (mappedStatus === 'Delivered' && !order.deliveredAt) order.deliveredAt = new Date();
      }
      await order.save();
    }

    res.json({ tracking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
