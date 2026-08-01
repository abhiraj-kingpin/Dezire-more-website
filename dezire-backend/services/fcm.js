// Push notifications to the Android app via Firebase Cloud Messaging.
// Uses the Admin SDK directly from this regular Express server — FCM
// sending doesn't require Cloud Functions or the Blaze billing plan, only
// a Firebase project (free Spark tier is enough) and a service account key.
//
// Required env var: FIREBASE_SERVICE_ACCOUNT — the *entire contents* of the
// service account JSON key file (Firebase Console > Project Settings >
// Service Accounts > Generate new private key), pasted as one env var
// value. Paste it exactly as downloaded; this parses it as JSON.

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

// Sends to every registered device for this user, dropping any token FCM
// reports as no-longer-valid (app uninstalled, token rotated, etc.) so
// User.fcmTokens doesn't slowly accumulate dead entries.
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

// Same customer-facing copy the order-status email already uses, so a
// customer with both channels enabled sees a consistent message.
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
