const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');

const app = require('./app');
const { connectDB } = require('./db');

const secretNames = [
  'MONGODB_URI', 'JWT_SECRET',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'GEMINI_API_KEY', 'GEMINI_MODEL',
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
  'SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD', 'SHIPROCKET_PICKUP_LOCATION', 'SHIPROCKET_WEBHOOK_SECRET',
  'DELHIVERY_API_TOKEN', 'DELHIVERY_PICKUP_LOCATION', 'DELHIVERY_ENV',
  'FIREBASE_SERVICE_ACCOUNT',
  'FRONTEND_URL',
];
const secrets = secretNames.map(defineSecret);

const REGION = 'asia-south1';

exports.api = onRequest(
  { region: REGION, secrets, memory: '512MiB', timeoutSeconds: 120 },
  app
);

exports.wishlistWatcher = onSchedule(
  { region: REGION, schedule: 'every 6 hours', secrets },
  async () => {
    await connectDB();
    const { checkWishlistAlerts } = require('./utils/wishlistWatcher');
    await checkWishlistAlerts();
  }
);
