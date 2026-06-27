require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');

const productRoutes = require('./routes/products');
const adminRoutes   = require('./routes/admin');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database connection ──────────────────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Routes ───────────────────────────────────────────────────────────────────

const chatRoute = require('./routes/chat');  

app.use('/api/products', productRoutes);
app.use('/api/admin',    adminRoutes);
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