const path = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const productRoutes = require('./routes/products');
const adminRoutes   = require('./routes/admin');
const orderRoutes   = require('./routes/orders');
const reviewRoutes  = require('./routes/reviews');
const exchangeRoutes = require('./routes/exchanges');
const chatRoute      = require('./routes/chat');
const { router: authRoutes } = require('./routes/auth');
const { router: couponRoutes } = require('./routes/coupons');

const app = express();

// Render (and most hosts, including Firebase Functions behind Google's
// load balancer) sit behind a reverse proxy — without this, express-rate-
// limit sees every request as coming from the proxy's IP instead of the
// real client, making the limits meaningless.
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────

// contentSecurityPolicy/crossOriginResourcePolicy are off: the admin panel
// is a single static HTML file full of inline <script> tags with no nonce
// setup, and product images are served from Cloudinary on a different
// origin — both would break under Helmet's strict defaults. Still get the
// rest: X-Content-Type-Options, X-Frame-Options, HSTS, etc.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://www.deziremore.com',
    'https://deziremore.com',
    'https://dezire-more-website-q2gf.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    // Capacitor's native app WebView origins (Android/iOS)
    'https://localhost',
    'capacitor://localhost',
  ],
  credentials: true,
}));
// Stashes the raw request bytes alongside the parsed body — needed to
// verify the Razorpay webhook's HMAC signature, which is computed over
// the exact raw payload, not the re-serialized parsed JSON.
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Ensures the DB connection (and one-time coupon seed) is ready before any
// request is handled. On Render this resolves almost instantly since
// connectDB() is also kicked off at boot below; on Firebase Functions this
// is what actually guarantees a cold-started instance doesn't serve a
// request before Mongoose is connected.
app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/coupons',  couponRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoute);

// Health check
app.get('/api/health', async (req, res) => {
  const count = await require('./models/Product').countDocuments({ isActive: true });
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    products: count,
  });
});

module.exports = app;
