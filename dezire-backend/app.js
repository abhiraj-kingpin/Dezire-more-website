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
const testimonialRoutes = require('./routes/testimonials');
const paymentSettingsRoutes = require('./routes/paymentSettings');
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
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/coupons',  couponRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoute);

// GET /sitemap.xml — generated from the storefront's static/category routes
// (mirrors src/App.jsx's route table) instead of a hand-maintained file that
// silently goes stale. lastmod is just "today" on every request since none
// of these pages track a real per-page modification date — good enough for
// crawl priority/discovery, which is what actually matters here. Product
// detail pages don't have their own URL yet (they only ever open in a modal
// over a category page), so there's nothing to add for them until that
// changes — deliberately out of scope for now.
const SITE_URL = 'https://www.deziremore.com';
const SITEMAP_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/sarees', priority: '0.9' },
  { path: '/dress-materials', priority: '0.9' },
  { path: '/ready-to-wear', priority: '0.9' },
  { path: '/western-apparels', priority: '0.9' },
  { path: '/jewelry-accessories', priority: '0.9' },
  { path: '/bestsellers', priority: '0.8' },
  { path: '/new-arrivals', priority: '0.8' },
  { path: '/membership', priority: '0.7' },
  { path: '/our-story', priority: '0.6' },
  { path: '/faq', priority: '0.5' },
  { path: '/help-support', priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/size-guide', priority: '0.4' },
  { path: '/shipping-policy', priority: '0.3' },
  { path: '/exchange-policy', priority: '0.3' },
  { path: '/privacy-policy', priority: '0.2' },
  { path: '/terms-conditions', priority: '0.2' },
];
app.get('/sitemap.xml', (req, res) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = SITEMAP_ROUTES.map(r =>
    `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${lastmod}</lastmod><priority>${r.priority}</priority></url>`
  ).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
});

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
