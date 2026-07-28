const path = require('path');
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const mongoose = require('mongoose');

const productRoutes = require('./routes/products');
const adminRoutes   = require('./routes/admin');
const orderRoutes   = require('./routes/orders');
const reviewRoutes  = require('./routes/reviews');
const { router: authRoutes } = require('./routes/auth');
const { router: couponRoutes } = require('./routes/coupons');

const app = express();

// Render (and most hosts) sit behind a reverse proxy — without this,
// express-rate-limit sees every request as coming from the proxy's IP
// instead of the real client, making the limits meaningless.
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// ─── Database connection ──────────────────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅  MongoDB connected');
    // The chatbot has always advertised "DEZIRE10" as a working 10% discount
    // code, but nothing backed it until the coupon system existed — seed it
    // once so that promise is actually true.
    const Coupon = require('./models/Coupon');
    const exists = await Coupon.findOne({ code: 'DEZIRE10' });
    if (!exists) {
      await Coupon.create({ code: 'DEZIRE10', type: 'percent', value: 10 });
      console.log('✅  Seeded DEZIRE10 coupon (10% off)');
    }
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Routes ───────────────────────────────────────────────────────────────────

const chatRoute = require('./routes/chat');  

app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/reviews',  reviewRoutes);
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

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Dezire More API → http://localhost:${PORT}`);
  console.log(`   Admin login  → POST /api/admin/login`);
  console.log(`   Products     → GET  /api/products`);
  console.log(`   Chat         → POST /api/chat`);
});
