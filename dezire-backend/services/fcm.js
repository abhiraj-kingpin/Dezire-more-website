
const admin = require('firebase-admin');

let app = null;
let initAttempted = false;

function getApp() {
  if (initAttempted) return app;
  initAttempted = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn('[fcm] FIREBASE_SERVICE_ACCOUNT not set — push notifications are disabled.');
    return null;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return app;
  } catch (err) {
    console.error('[fcm] Failed to initialize firebase-admin — check FIREBASE_SERVICE_ACCOUNT is valid JSON:', err.message);
    return null;
  }
}

function isConfigured() {
  return !!getApp();
}

async function sendToUser(user, { title, body, data = {} }) {
  const firebaseApp = getApp();
  if (!firebaseApp || !user?.fcmTokens?.length) return { sent: 0 };

  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens: user.fcmTokens,
  };

  const res = await admin.messaging(firebaseApp).sendEachForMulticast(message);

  const deadTokens = [];
  res.responses.forEach((r, i) => {
    if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
      deadTokens.push(user.fcmTokens[i]);
    }
  });
  if (deadTokens.length) {
    const User = require('../models/User');
    await User.updateOne({ _id: user._id }, { $pullAll: { fcmTokens: deadTokens } }).catch(() => {});
  }

  return { sent: res.successCount };
}

const { ORDER_STATUS_MESSAGES } = require('../utils/notifications');

async function sendOrderStatusPush(user, order) {
  const message = ORDER_STATUS_MESSAGES[order.orderStatus];
  if (!message) return { sent: 0 };
  return sendToUser(user, {
    title: `Order ${order.orderNumber}: ${order.orderStatus}`,
    body: message,
    data: { orderId: String(order._id), orderStatus: order.orderStatus },
  });
}

module.exports = { isConfigured, sendToUser, sendOrderStatusPush };
