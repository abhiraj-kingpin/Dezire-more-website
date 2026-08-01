// Shiprocket integration — real courier shipment creation, AWB (tracking
// number) assignment, and inbound webhook status updates. Built against
// Shiprocket's long-documented v1 external API (stable for years — same
// endpoints referenced across their own docs, Postman collection, and
// third-party SDKs), but NOT yet exercised against a real Shiprocket
// account: no such account exists on this project yet (that's the client's
// own signup, same as Razorpay). Smoke-test end-to-end the moment
// SHIPROCKET_EMAIL/PASSWORD are actually set.
//
// Required env vars: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD (the login used
// on shiprocket.in, not a separate API key — Shiprocket's v1 API exchanges
// these for a Bearer token), SHIPROCKET_PICKUP_LOCATION (the "Nickname" of
// the pickup address configured in Shiprocket's dashboard under
// Settings > Company > Pickup Addresses), and optionally
// SHIPROCKET_WEBHOOK_SECRET (a shared secret you also paste into
// Shiprocket's Settings > API > Webhook config — it's sent back on every
// webhook call so this endpoint can reject anything that isn't really
// from Shiprocket).

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Tokens are valid for ~10 days per Shiprocket's docs — cached in memory
// and re-fetched a little early rather than tracking the exact expiry.
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;
let cachedToken = null;
let cachedTokenAt = 0;

function isConfigured() {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

async function getToken() {
  if (cachedToken && Date.now() - cachedTokenAt < TOKEN_TTL_MS) return cachedToken;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Shiprocket auth failed: ${data.message || res.statusText}`);
  }
  cachedToken = data.token;
  cachedTokenAt = Date.now();
  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Shiprocket API error (${res.status}): ${data.message || JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

// Splits "Jane Doe" into billing_customer_name/billing_last_name the way
// Shiprocket's order payload expects two separate fields.
function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '.' };
}

// Creates the order on Shiprocket, then immediately assigns a courier/AWB
// so a single "Create Shipment" click in the admin panel produces a
// trackable order — Shiprocket's own flow otherwise splits these into two
// separate calls (create order, then assign AWB against the returned
// shipment_id).
async function createShipment(order, { weight, length, breadth, height }) {
  if (!isConfigured()) return { configured: false };

  const { first, last } = splitName(order.customerName);
  const orderRes = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify({
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: first,
      billing_last_name: last,
      billing_address: order.address.line1,
      billing_city: order.address.city,
      billing_pincode: order.address.pin,
      billing_state: order.address.state,
      billing_country: 'India',
      billing_email: order.customerEmail,
      billing_phone: order.customerPhone,
      shipping_is_billing: true,
      order_items: order.items.map(item => ({
        name: item.name,
        sku: String(item.productId || item.name).slice(0, 50),
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      sub_total: order.total,
      length, breadth, height, weight,
    }),
  });

  const shiprocketOrderId = orderRes.order_id;
  const shiprocketShipmentId = orderRes.shipment_id;
  if (!shiprocketShipmentId) {
    throw new Error(orderRes.message || 'Shiprocket did not return a shipment_id');
  }

  const awbRes = await shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shiprocketShipmentId }),
  });

  const awbCode = awbRes.response?.data?.awb_code;
  const courierName = awbRes.response?.data?.courier_name;
  if (!awbCode) {
    // Order exists on Shiprocket even if AWB assignment failed (e.g. no
    // courier serviceable for this pincode yet) — surface both pieces of
    // state rather than throwing away the order_id/shipment_id already won.
    return {
      configured: true, awbAssigned: false,
      shiprocketOrderId, shiprocketShipmentId,
      error: awbRes.message || 'No courier could be auto-assigned for this pincode',
    };
  }

  return {
    configured: true, awbAssigned: true,
    shiprocketOrderId, shiprocketShipmentId, awbCode, courierName,
    trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
  };
}

// Shiprocket's own status strings (as sent in their webhook payload) mapped
// to this app's existing Order.orderStatus enum — anything not listed here
// is recorded as shipment.lastTrackingStatus but doesn't move orderStatus,
// since this app's enum is deliberately small and customer-facing.
const TRACKING_STATUS_MAP = {
  'SHIPPED': 'Shipped',
  'IN TRANSIT': 'Shipped',
  'OUT FOR DELIVERY': 'Out for Delivery',
  'DELIVERED': 'Delivered',
  'CANCELLED': 'Cancelled',
};

function mapTrackingStatus(shiprocketStatus) {
  const key = (shiprocketStatus || '').trim().toUpperCase();
  return TRACKING_STATUS_MAP[key] || null;
}

module.exports = { isConfigured, createShipment, mapTrackingStatus };
