const express = require('express');
const router = express.Router();
const { requireAuth } = require('./auth');
const razorpayCustomer = require('../services/razorpayCustomer');

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!razorpayCustomer.isConfigured()) {
      return res.json({
        mode: 'reference',
        cards: (req.user.savedPaymentMethods || []).map(m => ({
          id: m._id, label: m.label, last4: m.last4, isDefault: m.isDefault,
        })),
      });
    }

    const customer = await razorpayCustomer.getOrCreateCustomer(req.user);
    if (customer.id && customer.id !== req.user.razorpayCustomerId) {
      req.user.razorpayCustomerId = customer.id;
      await req.user.save();
    }
    const cards = await razorpayCustomer.listSavedCards(customer.id);
    res.json({ mode: 'razorpay', cards });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/customer-id', requireAuth, async (req, res) => {
  try {
    if (!razorpayCustomer.isConfigured()) return res.json({ customerId: null });
    const customer = await razorpayCustomer.getOrCreateCustomer(req.user);
    if (customer.id && customer.id !== req.user.razorpayCustomerId) {
      req.user.razorpayCustomerId = customer.id;
      await req.user.save();
    }
    res.json({ customerId: customer.id });
  } catch (err) {
    res.json({ customerId: null });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    if (razorpayCustomer.isConfigured()) {
      return res.status(400).json({ error: 'Save a card at checkout — cards can\'t be added directly here.' });
    }
    const { label, last4 } = req.body || {};
    if (!label || !label.trim()) return res.status(400).json({ error: 'Enter a label for this payment method' });

    const isFirst = (req.user.savedPaymentMethods || []).length === 0;
    req.user.savedPaymentMethods.push({ label: label.trim(), last4: (last4 || '').trim().slice(-4), isDefault: isFirst });
    await req.user.save();
    res.status(201).json({ success: true, cards: req.user.savedPaymentMethods });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/default', requireAuth, async (req, res) => {
  try {
    if (razorpayCustomer.isConfigured()) {
      return res.status(400).json({ error: 'Default card is managed at checkout.' });
    }
    let found = false;
    req.user.savedPaymentMethods.forEach(m => {
      const isTarget = String(m._id) === req.params.id;
      m.isDefault = isTarget;
      if (isTarget) found = true;
    });
    if (!found) return res.status(404).json({ error: 'Payment method not found' });
    await req.user.save();
    res.json({ success: true, cards: req.user.savedPaymentMethods });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!razorpayCustomer.isConfigured()) {
      req.user.savedPaymentMethods = req.user.savedPaymentMethods.filter(m => String(m._id) !== req.params.id);
      await req.user.save();
      return res.json({ success: true, cards: req.user.savedPaymentMethods });
    }

    if (!req.user.razorpayCustomerId) return res.status(404).json({ error: 'No saved cards found' });
    await razorpayCustomer.deleteSavedCard(req.user.razorpayCustomerId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
