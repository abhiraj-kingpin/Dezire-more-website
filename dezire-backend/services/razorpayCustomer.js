// Razorpay Customer + Saved Card (Tokens) API — backs the "Payment Methods"
// account page and lets a returning customer's card get reused at checkout
// instead of re-entering it every time.
//
// Uses the same RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET already required for
// checkout (see routes/orders.js) — no separate credentials needed. Works
// immediately in Razorpay test mode, same as the rest of the Razorpay
// integration in this app.
//
// A card only ever gets tokenized as a side effect of a real Razorpay
// payment made with `save: 1` and this customer's `customer_id` attached
// (see the "Save this card" checkbox in Navbar.jsx's checkout) — there is
// deliberately no standalone "add a card without paying anything" flow
// here. Building that safely means either an auth-and-void or a
// charge-and-refund of a real (if small) amount, which isn't something to
// wire up unattended against an account that has never been smoke-tested
// end to end (see the same caution in services/delhivery.service.js and
// services/shiprocket.js).

const Razorpay = require('razorpay');

function isConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  if (!isConfigured()) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

// Reuses the customer record stored on the user (if any); otherwise looks
// one up by email — Razorpay itself de-dupes on email+contact — and
// creates one only as a last resort. The caller is responsible for
// persisting the returned id onto User.razorpayCustomerId.
async function getOrCreateCustomer(user) {
  const client = getClient();
  if (!client) throw new Error('Razorpay is not configured');

  if (user.razorpayCustomerId) {
    try {
      return await client.customers.fetch(user.razorpayCustomerId);
    } catch {
      // Stale/deleted id on our side — fall through and re-resolve it.
    }
  }

  try {
    return await client.customers.create({
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      contact: user.phone || undefined,
      fail_existing: 0, // returns the existing customer instead of erroring if this email already has one
    });
  } catch (err) {
    throw new Error(err?.error?.description || err.message || 'Could not set up saved cards for this account');
  }
}

// Maps Razorpay's token list response down to only what the account page
// needs to display — never the token itself beyond its id, and never any
// raw card number (Razorpay doesn't return one; this is just being explicit
// that nothing sensitive should ever get added to this shape).
async function listSavedCards(customerId) {
  const client = getClient();
  if (!client) throw new Error('Razorpay is not configured');

  const { items } = await client.customers.fetchTokens(customerId);
  return (items || [])
    .filter(tok => tok.method === 'card' && tok.card)
    .map(tok => ({
      id: tok.id,
      network: tok.card.network,
      last4: tok.card.last4,
      expiryMonth: tok.card.expiry_month,
      expiryYear: tok.card.expiry_year,
      issuer: tok.card.issuer,
    }));
}

async function deleteSavedCard(customerId, tokenId) {
  const client = getClient();
  if (!client) throw new Error('Razorpay is not configured');
  await client.customers.deleteToken(customerId, tokenId);
}

module.exports = { isConfigured, getOrCreateCustomer, listSavedCards, deleteSavedCard };
