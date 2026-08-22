require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./db');


connectDB()
  .then(() => {
    const { checkWishlistAlerts } = require('./utils/wishlistWatcher');
    setTimeout(() => checkWishlistAlerts().catch(err => console.error('[wishlist watcher]', err.message)), 30 * 1000);
    setInterval(() => checkWishlistAlerts().catch(err => console.error('[wishlist watcher]', err.message)), 6 * 60 * 60 * 1000);
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Dezire More API → http://localhost:${PORT}`);
  console.log(`   Admin login  → POST /api/admin/login`);
  console.log(`   Products     → GET  /api/products`);
  console.log(`   Chat         → POST /api/chat`);
});
