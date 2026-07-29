// Firebase Functions v2 entry point. Render/local dev use server.js instead
// (see the comment there) — this file is only ever loaded when deployed to
// Firebase. Secrets are pulled from Google Secret Manager at runtime via
// `secrets: [...]` on each function; set their values once with:
//   firebase functions:secrets:set SECRET_NAME
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');

const app = require('./app');
const { connectDB } = require('./db');

const secretNames = [
  'MONGODB_URI', 'JWT_SECRET',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
  'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  'OPENROUTER_API_KEY',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
  'FRONTEND_URL',
];
const secrets = secretNames.map(defineSecret);

// Region picked close to India (both your users and, most likely, your
// MongoDB Atlas cluster's region) — change if your Atlas region differs,
// since cross-region calls to the database add real latency per request.
const REGION = 'asia-south1';

// The whole Express app, as one HTTP function. Bumped memory/timeout past
// the defaults (256MiB/60s) since product image/video uploads go through
// this same function.
exports.api = onRequest(
  { region: REGION, secrets, memory: '512MiB', timeoutSeconds: 120 },
  app
);

// Replaces the setInterval in server.js, which can't be relied on here —
// a Cloud Functions instance can be frozen or torn down between requests,
// so nothing guarantees an in-memory interval keeps firing. This runs
// independently on its own schedule instead.
exports.wishlistWatcher = onSchedule(
  { region: REGION, schedule: 'every 6 hours', secrets },
  async () => {
    await connectDB();
    const { checkWishlistAlerts } = require('./utils/wishlistWatcher');
    await checkWishlistAlerts();
  }
);
