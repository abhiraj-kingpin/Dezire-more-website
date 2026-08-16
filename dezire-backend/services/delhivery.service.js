
const BASE_URL = process.env.DELHIVERY_ENV === 'production'
  ? 'https://track.delhivery.com'
  : 'https://staging-express.delhivery.com';

function isConfigured() {
  return !!(process.env.DELHIVERY_API_TOKEN && process.env.DELHIVERY_PICKUP_LOCATION);
}

async function delhiveryFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const message = (data && data.rmk) || (typeof data === 'string' ? data : JSON.stringify(data).slice(0, 300));
    throw new Error(`Delhivery API error (${res.status}): ${message}`);
  }
  return data;
}

async function fetchWaybill() {
  const data = await delhiveryFetch(`/waybill/api/fetch/json/?cl=${encodeURIComponent(process.env.DELHIVERY_PICKUP_LOCATION)}`);
  const waybill = typeof data === 'string' ? data.trim() : data.waybill || data;
  if (!waybill) throw new Error('Delhivery did not return a waybill number');
  return waybill;
}

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '' };
}

async function createShipment(order, { weight = 0.5 } = {}) {
  if (!isConfigured()) return { configured: false };

  const waybill = await fetchWaybill();
  const { first, last } = splitName(order.customerName);

  const payload = {
    pickup_location: { name: process.env.DELHIVERY_PICKUP_LOCATION },
    shipments: [{
      waybill,
      order: order.orderNumber,
      name: `${first} ${last}`.trim(),
      add: order.address.line1,
      pin: order.address.pin,
      city: order.address.city,
      state: order.address.state,
      country: 'India',
      phone: order.customerPhone,
      payment_mode: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      cod_amount: order.paymentMethod === 'COD' ? order.total : 0,
      total_amount: order.total,
      quantity: String(order.items.reduce((sum, i) => sum + i.quantity, 0)),
      products_desc: order.items.map(i => i.name).join(', ').slice(0, 500),
      weight: String(weight),
    }],
  };

  const data = await delhiveryFetch('/api/cmu/create.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const pkg = data.packages?.[0];
  if (!data.success || pkg?.status !== 'Success') {
    return {
      configured: true, awbAssigned: false,
      error: data.rmk || pkg?.remarks || 'Delhivery rejected the shipment (check pincode serviceability and pickup location name)',
    };
  }

  return {
    configured: true, awbAssigned: true,
    awbCode: pkg.waybill,
    courierName: 'Delhivery',
    trackingUrl: `https://www.delhivery.com/track-v2/package/${pkg.waybill}`,
  };
}

async function trackShipment(awbCode) {
  if (!isConfigured()) throw new Error('Delhivery is not configured');
  const data = await delhiveryFetch(`/api/v1/packages/json/?waybill=${encodeURIComponent(awbCode)}`);
  const shipment = data.ShipmentData?.[0]?.Shipment;
  if (!shipment) throw new Error('Delhivery has no record of this waybill');
  return {
    status: shipment.Status?.Status,
    statusType: shipment.Status?.StatusType,
    statusLocation: shipment.Status?.StatusLocation,
    statusDateTime: shipment.Status?.StatusDateTime,
    instructions: shipment.Status?.Instructions,
  };
}

async function cancelShipment(awbCode) {
  if (!isConfigured()) throw new Error('Delhivery is not configured');
  const data = await delhiveryFetch('/api/p/edit', {
    method: 'POST',
    body: JSON.stringify({ waybill: awbCode, cancellation: 'true' }),
  });
  if (!data.status) throw new Error(data.remark || 'Delhivery could not cancel this shipment');
  return { cancelled: true, remark: data.remark };
}

const TRACKING_STATUS_MAP = {
  'DISPATCHED': 'Shipped',
  'IN TRANSIT': 'Shipped',
  'OUT FOR DELIVERY': 'Out for Delivery',
  'DELIVERED': 'Delivered',
  'RTO': 'Cancelled',
  'CANCELLED': 'Cancelled',
};

function mapTrackingStatus(delhiveryStatusType) {
  const key = (delhiveryStatusType || '').trim().toUpperCase();
  return TRACKING_STATUS_MAP[key] || null;
}

module.exports = { isConfigured, createShipment, trackShipment, cancelShipment, mapTrackingStatus };
