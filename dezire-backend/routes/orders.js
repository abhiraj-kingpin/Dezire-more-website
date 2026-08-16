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
const delhivery = require('../services/delhivery.service');
const fcm = require('../services/fcm');

const GST_RATE_THRESHOLD = 2499;
const GST_RATE_LOW = 5;
const GST_RATE_HIGH = 18;
const FREE_SHIPPING_THRESHOLD = 2500;
const SHIPPING_CHARGE = 99;

function gstRateFor(unitPrice) {
  return unitPrice >= GST_RATE_THRESHOLD ? GST_RATE_HIGH : GST_RATE_LOW;
}

function computeBilling(items) {
  let subtotal = 0;
  let gst5 = 0;
  let gst18 = 0;

  const itemsWithGST = items.map(item => {
    const rate = gstRateFor(item.price);
    const lineBase = item.price * item.quantity;
    const gstAmount = Math.round(lineBase * rate) / 100;
    subtotal += lineBase;
    if (rate === GST_RATE_HIGH) gst18 += gstAmount; else gst5 += gstAmount;
    return { ...item, gstRate: rate, gstAmount };
  });

  const totalGST = Math.round((gst5 + gst18) * 100) / 100;
  const deliveryCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

  return {
    itemsWithGST,
    subtotal,
    totalGST,
    gstBreakdown: { gst5: Math.round(gst5 * 100) / 100, gst18: Math.round(gst18 * 100) / 100 },
    deliveryCharge,
  };
}

function getRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

const CANCELLABLE_STATUSES = ['Order Placed', 'Payment Confirmed', 'Processing'];

function generateOrderNumber() {
  return 'DZM' + Math.floor(100000 + Math.random() * 900000);
}

function estimatedDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d;
}

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

router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      customerName, customerPhone,
      items, address,
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
    if (paymentMethod === 'COD') {
      return res.status(400).json({ error: 'Cash on Delivery is no longer available — please pay via UPI.' });
    }

    const { itemsWithGST, subtotal, totalGST, gstBreakdown, deliveryCharge } = computeBilling(items);

    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const result = await resolveCoupon(couponCode, subtotal);
      if (result.error) return res.status(400).json({ error: result.error });
      discountAmount = result.discount;
      appliedCoupon = result.coupon;
    }
    const resolvedTotal = subtotal - discountAmount + totalGST + deliveryCharge;

    let orderNumber = generateOrderNumber();
    for (let i = 0; i < 3 && await Order.exists({ orderNumber }); i++) {
      orderNumber = generateOrderNumber();
    }

    const order = await Order.create({
      orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      items: itemsWithGST,
      address,
      subtotal,
      totalGST,
      gstBreakdown,
      deliveryCharge,
      total: resolvedTotal,
      couponCode: appliedCoupon?.code,
      discountAmount,
      paymentMethod,
      paymentReference: paymentReference?.trim() || undefined,
      amountPaid: Number(amountPaid) > 0 ? Number(amountPaid) : undefined,
      paymentStatus: 'pending',
      orderStatus: 'Order Placed',
      estimatedDelivery: estimatedDeliveryDate(),
      isGift: !!isGift,
      giftMessage: isGift ? giftMessage : undefined,
    });

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

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

    sendOrderConfirmationEmail(order).catch(err => console.error('[order email]', err.message));
    sendAdminOrderAlert(order).catch(err => console.error('[admin alert]', err.message));

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/razorpay/create-payment-order', requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ error: 'Online payment is temporarily unavailable. Please try again shortly.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This order has already been paid' });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
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

async function autoCreateDelhiveryShipment(order) {
  if (!delhivery.isConfigured() || order.shipment?.awbCode) return;
  try {
    const result = await delhivery.createShipment(order);
    if (result.awbAssigned) {
      order.shipment = {
        provider: 'delhivery',
        awbCode: result.awbCode,
        courierName: result.courierName,
        trackingUrl: result.trackingUrl,
      };
      order.orderStatus = 'Shipped';
      await order.save();
      logAdminAction('system', 'order.auto-shipment', order._id, `${order.orderNumber}: AWB ${result.awbCode} (Delhivery, auto-created on payment)`);
      const customer = await User.findOne({ email: order.customerEmail }).select('notificationsEnabled fcmTokens').lean();
      if (!customer || customer.notificationsEnabled !== false) {
        sendOrderStatusEmail(order).catch(err => console.error('[order status email]', err.message));
        if (customer) fcm.sendOrderStatusPush(customer, order).catch(err => console.error('[order status push]', err.message));
      }
    } else {
      console.error(`[auto-shipment] Delhivery rejected ${order.orderNumber}: ${result.error}`);
    }
  } catch (err) {
    console.error(`[auto-shipment] Failed for ${order.orderNumber}:`, err.message);
  }
}

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
      autoCreateDelhiveryShipment(order).catch(err => console.error('[auto-shipment]', err.message));
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
        autoCreateDelhiveryShipment(order).catch(err => console.error('[auto-shipment]', err.message));
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[razorpay webhook]', err.message);
    res.status(500).send('Webhook error');
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email, hiddenFromCustomer: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/hide', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'This order does not belong to your account' });
    }

    order.hiddenFromCustomer = true;
    await order.save();

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ data: orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.get('/admin/gst-report', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const from = req.query.from ? new Date(req.query.from) : defaultFrom;
    const to = req.query.to ? new Date(new Date(req.query.to).getTime() + 24 * 60 * 60 * 1000) : defaultTo;

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Invalid from/to date' });
    }

    const match = { paymentStatus: 'paid', createdAt: { $gte: from, $lt: to } };

    const [totals, orders] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            subtotal: { $sum: '$subtotal' },
            gst5: { $sum: '$gstBreakdown.gst5' },
            gst18: { $sum: '$gstBreakdown.gst18' },
            totalGST: { $sum: '$totalGST' },
            deliveryCharge: { $sum: '$deliveryCharge' },
            discountAmount: { $sum: '$discountAmount' },
            total: { $sum: '$total' },
          },
        },
      ]),
      Order.find(match)
        .select('orderNumber createdAt subtotal gstBreakdown totalGST deliveryCharge discountAmount total')
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const totalsRow = totals[0] || {
      orders: 0, subtotal: 0, gst5: 0, gst18: 0, totalGST: 0, deliveryCharge: 0, discountAmount: 0, total: 0,
    };
    delete totalsRow._id;

    res.json({
      from: from.toISOString(),
      to: new Date(to.getTime() - 1).toISOString(),
      ...totalsRow,
      cgst: totalsRow.totalGST / 2,
      sgst: totalsRow.totalGST / 2,
      orderDetails: orders.map(o => ({
        orderNumber: o.orderNumber,
        date: o.createdAt,
        subtotal: o.subtotal,
        gst5: o.gstBreakdown?.gst5 || 0,
        gst18: o.gstBreakdown?.gst18 || 0,
        totalGST: o.totalGST,
        deliveryCharge: o.deliveryCharge,
        discountAmount: o.discountAmount,
        total: o.total,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    autoCreateDelhiveryShipment(order).catch(err => console.error('[auto-shipment]', err.message));

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/admin/:orderId/reject-payment', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This order is already marked paid — cannot reject it.' });
    }
    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ error: 'This order is already cancelled.' });
    }

    order.paymentStatus = 'failed';
    order.orderStatus = 'Cancelled';
    order.cancellationReason = 'Payment not verified by admin';
    await order.save();

    logAdminAction(req.admin.email, 'order.reject-payment', order._id, `${order.orderNumber}: UTR ${order.paymentReference || 'n/a'} did not match/land — marked payment failed, order cancelled`);

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
    if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment hasn\'t been verified for this order yet — verify it before creating a shipment.' });
    }

    const { weight = 0.5, length = 30, breadth = 20, height = 5 } = req.body || {};
    const result = await shiprocket.createShipment(order, { weight, length, breadth, height });

    order.shipment = {
      provider: 'shiprocket',
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

router.patch('/admin/:orderId/manual-tracking', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.shipment?.awbCode) {
      return res.status(400).json({ error: `This order already has a shipment (AWB ${order.shipment.awbCode}).` });
    }
    if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment hasn\'t been verified for this order yet — verify it before adding tracking.' });
    }

    const { awbCode, courierName, trackingUrl } = req.body || {};
    if (!awbCode?.trim()) return res.status(400).json({ error: 'Tracking number is required' });
    if (!courierName?.trim()) return res.status(400).json({ error: 'Courier name is required' });

    order.shipment = {
      provider: 'manual',
      awbCode: awbCode.trim(),
      courierName: courierName.trim(),
      trackingUrl: trackingUrl?.trim() || `https://t.17track.net/en#nums=${encodeURIComponent(awbCode.trim())}`,
    };
    order.orderStatus = 'Shipped';
    await order.save();

    logAdminAction(req.admin.email, 'order.manual-tracking', order._id, `${order.orderNumber}: AWB ${order.shipment.awbCode} (${order.shipment.courierName})`);

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
