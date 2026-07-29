const User = require('../models/User');
const Product = require('../models/Product');
const { sendWishlistAlertEmail } = require('./notifications');

// Runs periodically (see server.js) — compares each wishlisted item's
// current price/stock against what's on file for that user and emails a
// batched summary of anything worth telling them about. No-ops quietly if
// SMTP isn't configured (sendWishlistAlertEmail already handles that), so
// this is safe to run before email is set up.
async function checkWishlistAlerts() {
  const users = await User.find({ 'wishlist.0': { $exists: true } });

  for (const user of users) {
    const productIds = user.wishlist.map(w => w.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('name price inStock').lean();
    const productMap = new Map(products.map(p => [String(p._id), p]));

    const alerts = [];
    let changed = false;

    for (const item of user.wishlist) {
      const product = productMap.get(String(item.productId));
      if (!product) continue; // deleted since being wishlisted

      const referencePrice = item.lastNotifiedPrice ?? item.priceAtAdd;
      if (product.price < referencePrice) {
        alerts.push({ type: 'price-drop', product, oldPrice: referencePrice, newPrice: product.price });
        item.lastNotifiedPrice = product.price;
        changed = true;
      }

      if (product.inStock && !item.lastKnownInStock) {
        alerts.push({ type: 'back-in-stock', product });
        changed = true;
      }
      if (item.lastKnownInStock !== product.inStock) {
        item.lastKnownInStock = product.inStock;
        changed = true;
      }
    }

    if (alerts.length > 0 && user.notificationsEnabled !== false) {
      sendWishlistAlertEmail(user, alerts).catch(err => console.error('[wishlist alert email]', err.message));
    }
    if (changed) await user.save();
  }
}

module.exports = { checkWishlistAlerts };
