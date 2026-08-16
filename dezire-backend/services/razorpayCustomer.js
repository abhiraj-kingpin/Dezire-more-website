
const Razorpay = require('razorpay');

function isConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  if (!isConfigured()) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

async function getOrCreateCustomer(user) {
  const client = getClient();
  if (!client) throw new Error('Razorpay is not configured');

  if (user.razorpayCustomerId) {
    try {
      return await client.customers.fetch(user.razorpayCustomerId);
    } catch {
    }
  }

  try {
    return await client.customers.create({
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      contact: user.phone || undefined,
      fail_existing: 0,
    });
  } catch (err) {
    throw new Error(err?.error?.description || err.message || 'Could not set up saved cards for this account');
  }
}

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
