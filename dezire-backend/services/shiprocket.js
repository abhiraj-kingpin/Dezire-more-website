
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

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

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '.' };
}

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
